USE event_booking;

-- =====================================================================
-- FEATURE 1: TRANSACTION — hold a seat (or multiple seats) atomically
-- Wrapped as a stored procedure so the app calls one statement and MySQL
-- guarantees booking + seat_holds + seats.status all change together.
-- =====================================================================
DELIMITER $$

CREATE PROCEDURE hold_seats(
    IN p_attendee_id INT,
    IN p_event_id    INT,
    IN p_seat_ids    VARCHAR(500),   -- comma-separated seat_ids, e.g. '1,2,3'
    IN p_hold_minutes INT,
    OUT p_booking_id INT
)
proc_body: BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_unavailable INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Lock the candidate seat rows so concurrent calls can't both pass the availability check
    SELECT COUNT(*) INTO v_unavailable
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids)
      AND event_id = p_event_id
      AND status <> 'available'
    FOR UPDATE;

    IF v_unavailable > 0 THEN
        ROLLBACK;
        SET p_booking_id = -1;  -- signal: one or more seats already unavailable
        LEAVE proc_body;
    END IF;

    SELECT COALESCE(SUM(price), 0) INTO v_total
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    INSERT INTO bookings (attendee_id, event_id, status, total_amount)
    VALUES (p_attendee_id, p_event_id, 'held', v_total);

    SET p_booking_id = LAST_INSERT_ID();

    INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
    SELECT p_booking_id, seat_id, price
    FROM seats
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    UPDATE seats
    SET status = 'held'
    WHERE FIND_IN_SET(seat_id, p_seat_ids) AND event_id = p_event_id;

    INSERT INTO seat_holds (booking_id, expires_at, status)
    VALUES (p_booking_id, DATE_ADD(NOW(), INTERVAL p_hold_minutes MINUTE), 'active');

    COMMIT;
END$$

-- Confirm a booking once payment succeeds — also atomic
CREATE PROCEDURE confirm_booking(
    IN p_booking_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(30)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE bookings SET status = 'confirmed' WHERE booking_id = p_booking_id AND status = 'held';

    UPDATE seats s
    JOIN booking_seats bs ON bs.seat_id = s.seat_id
    SET s.status = 'booked'
    WHERE bs.booking_id = p_booking_id;

    UPDATE seat_holds SET status = 'converted' WHERE booking_id = p_booking_id;

    INSERT INTO payments (booking_id, amount, payment_method, payment_status)
    VALUES (p_booking_id, p_amount, p_payment_method, 'success');

    COMMIT;
END$$

DELIMITER ;

-- =====================================================================
-- FEATURE 2: TRIGGER — not real-time by itself (MySQL triggers only fire
-- on DML against the triggering table), so expiry release is implemented
-- as an event-driven trigger on seat_holds UPDATE *plus* a scheduled
-- MySQL EVENT that sweeps expired holds every minute. Documented as one
-- combined "trigger" feature: the trigger does the release logic, the
-- event is what invokes it on a schedule.
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_release_expired_hold
BEFORE UPDATE ON seat_holds
FOR EACH ROW
BEGIN
    IF NEW.status = 'released' AND OLD.status = 'active' THEN
        UPDATE seats s
        JOIN booking_seats bs ON bs.seat_id = s.seat_id
        SET s.status = 'available'
        WHERE bs.booking_id = NEW.booking_id;

        UPDATE bookings
        SET status = 'expired'
        WHERE booking_id = NEW.booking_id AND status = 'held';
    END IF;
END$$

DELIMITER ;

SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_release_expired_holds
ON SCHEDULE EVERY 1 MINUTE
DO
  UPDATE seat_holds
  SET status = 'released'
  WHERE status = 'active' AND expires_at < NOW();

-- =====================================================================
-- FEATURE 3: STORED FUNCTION — dynamic pricing
-- =====================================================================
DELIMITER $$

CREATE FUNCTION calculate_dynamic_price(p_seat_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_base DECIMAL(10,2);
    DECLARE v_event_id INT;
    DECLARE v_final DECIMAL(10,2);

    SELECT price, event_id INTO v_base, v_event_id FROM seats WHERE seat_id = p_seat_id;
    SET v_final = v_base;

    SELECT v_final + SUM(
        CASE
            WHEN adjustment_type = 'percentage' THEN v_base * (adjustment_value / 100)
            WHEN adjustment_type = 'flat' THEN adjustment_value
            ELSE 0
        END
    ) INTO v_final
    FROM dynamic_pricing_rules
    WHERE event_id = v_event_id AND is_active = TRUE;

    RETURN GREATEST(v_final, 0);
END$$

DELIMITER ;

-- =====================================================================
-- FEATURE 4: VIEW — organizer sales dashboard
-- Uses pre-aggregated subqueries (not a flat multi-table JOIN) so that
-- a booking with several seats does not fan out and double-count revenue.
-- =====================================================================
CREATE VIEW organizer_sales_dashboard AS
SELECT
    e.event_id,
    e.event_name,
    e.event_date,
    o.org_name,
    COALESCE(seat_counts.seats_sold, 0)                          AS seats_sold,
    (SELECT COUNT(*) FROM seats s WHERE s.event_id = e.event_id) AS total_seats,
    COALESCE(revenue_totals.revenue, 0)                          AS revenue
FROM events e
JOIN organizers o ON o.organizer_id = e.organizer_id
LEFT JOIN (
    SELECT b.event_id, COUNT(bs.seat_id) AS seats_sold
    FROM bookings b
    JOIN booking_seats bs ON bs.booking_id = b.booking_id
    WHERE b.status = 'confirmed'
    GROUP BY b.event_id
) seat_counts ON seat_counts.event_id = e.event_id
LEFT JOIN (
    SELECT b.event_id, SUM(p.amount) AS revenue
    FROM bookings b
    JOIN payments p ON p.booking_id = b.booking_id AND p.payment_status = 'success'
    WHERE b.status = 'confirmed'
    GROUP BY b.event_id
) revenue_totals ON revenue_totals.event_id = e.event_id;

-- idx_seats_event_status already supports the FEATURE 5 (indexing) requirement from last week.
