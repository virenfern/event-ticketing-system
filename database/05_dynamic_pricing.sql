USE event_booking;

-- =====================================================================
-- Dynamic pricing v2
--   price = base seat price
--         + sum of the event's ACTIVE pricing rules (percentage or flat)
--         + automatic demand surcharge based on how full the event is:
--               >= 50% of seats held/booked  -> +10% of base price
--               >= 80% of seats held/booked  -> +25% of base price
-- Never returns NULL (events with no active rules just get base + demand),
-- never goes below 0, rounded to 2 decimals.
-- =====================================================================
DROP FUNCTION IF EXISTS calculate_dynamic_price;

DELIMITER $$

CREATE FUNCTION calculate_dynamic_price(p_seat_id INT)
RETURNS DECIMAL(10,2)
NOT DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_base       DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_event_id   INT DEFAULT NULL;
    DECLARE v_total      INT DEFAULT 0;
    DECLARE v_taken      INT DEFAULT 0;
    DECLARE v_adjust     DECIMAL(10,2) DEFAULT 0;
    DECLARE v_demand_pct DECIMAL(5,2) DEFAULT 0;
    DECLARE v_occupancy  DECIMAL(6,4) DEFAULT 0;

    SELECT price, event_id INTO v_base, v_event_id
    FROM seats WHERE seat_id = p_seat_id;

    IF v_base IS NULL THEN
        RETURN NULL;   -- unknown seat
    END IF;

    SELECT COUNT(*), COALESCE(SUM(status <> 'available'), 0)
      INTO v_total, v_taken
    FROM seats WHERE event_id = v_event_id;

    IF v_total > 0 THEN
        SET v_occupancy = v_taken / v_total;
    END IF;

    IF v_occupancy >= 0.80 THEN
        SET v_demand_pct = 25;
    ELSEIF v_occupancy >= 0.50 THEN
        SET v_demand_pct = 10;
    END IF;

    SELECT COALESCE(SUM(
        CASE
            WHEN adjustment_type = 'percentage' THEN v_base * (adjustment_value / 100)
            WHEN adjustment_type = 'flat'       THEN adjustment_value
            ELSE 0
        END), 0)
      INTO v_adjust
    FROM dynamic_pricing_rules
    WHERE event_id = v_event_id AND is_active = TRUE;

    RETURN ROUND(GREATEST(v_base + v_adjust + v_base * (v_demand_pct / 100), 0), 2);
END$$

-- =====================================================================
-- hold_seats: price every seat once, at hold time, and store it.
-- total_amount and price_at_booking both use the dynamic price, so the
-- attendee pays exactly what was quoted when they held the seats.
-- (Prices are computed BEFORE the seats are flipped to 'held', so every
-- seat in one booking is priced against the same occupancy.)
-- p_booking_id: >0 = success, -1 = seat unavailable, -2 = invalid seat ids
-- =====================================================================
DROP PROCEDURE IF EXISTS hold_seats$$

CREATE PROCEDURE hold_seats(
    IN p_attendee_id  INT,
    IN p_event_id     INT,
    IN p_seat_ids     VARCHAR(500),
    IN p_hold_minutes INT,
    OUT p_booking_id  INT
)
proc_body: BEGIN
    DECLARE v_total       DECIMAL(10,2) DEFAULT 0;
    DECLARE v_unavailable INT DEFAULT 0;
    DECLARE v_requested   INT DEFAULT 0;
    DECLARE v_found       INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_requested = LENGTH(p_seat_ids) - LENGTH(REPLACE(p_seat_ids, ',', '')) + 1;

    START TRANSACTION;

    SELECT COUNT(*), COALESCE(SUM(status <> 'available'), 0)
      INTO v_found, v_unavailable
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id
    FOR UPDATE;

    IF v_found <> v_requested THEN
        ROLLBACK;
        SET p_booking_id = -2;
        LEAVE proc_body;
    END IF;

    IF v_unavailable > 0 THEN
        ROLLBACK;
        SET p_booking_id = -1;
        LEAVE proc_body;
    END IF;

    SELECT COALESCE(SUM(calculate_dynamic_price(seat_id)), 0) INTO v_total
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    INSERT INTO bookings (attendee_id, event_id, status, total_amount)
    VALUES (p_attendee_id, p_event_id, 'held', v_total);

    SET p_booking_id = LAST_INSERT_ID();

    INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
    SELECT p_booking_id, seat_id, calculate_dynamic_price(seat_id)
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    UPDATE seats
    SET status = 'held'
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    INSERT INTO seat_holds (booking_id, expires_at, status)
    VALUES (p_booking_id, DATE_ADD(NOW(), INTERVAL p_hold_minutes MINUTE), 'active');

    COMMIT;
END$$

DELIMITER ;
