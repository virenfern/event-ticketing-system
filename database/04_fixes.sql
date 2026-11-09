USE event_booking;

-- =====================================================================
-- FIX 1: expired/released holds must free the booking_seats rows too,
-- otherwise UNIQUE(seat_id) blocks anyone from ever re-booking the seat.
-- The booking itself stays in `bookings` with status 'expired' as history.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_release_expired_hold;

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

        DELETE FROM booking_seats WHERE booking_id = NEW.booking_id;

        UPDATE bookings
        SET status = 'expired'
        WHERE booking_id = NEW.booking_id AND status = 'held';
    END IF;
END$$

-- =====================================================================
-- FIX 2: confirm_booking now
--   * only confirms a booking that belongs to the caller,
--   * only if it is still 'held' with an unexpired hold,
--   * takes the amount from the booking itself (never from the client).
-- Result codes: 'confirmed', 'not_found', 'not_held'
-- =====================================================================
DROP PROCEDURE IF EXISTS confirm_booking$$

CREATE PROCEDURE confirm_booking(
    IN  p_booking_id     INT,
    IN  p_attendee_id    INT,
    IN  p_payment_method VARCHAR(30),
    OUT p_result         VARCHAR(20)
)
proc_body: BEGIN
    DECLARE v_status  VARCHAR(20) DEFAULT NULL;
    DECLARE v_total   DECIMAL(10,2) DEFAULT 0;
    DECLARE v_expires DATETIME DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Lock the hold row first (same order the expiry sweep uses) to avoid deadlocks
    SELECT expires_at INTO v_expires
    FROM seat_holds
    WHERE booking_id = p_booking_id AND status = 'active'
    FOR UPDATE;

    SELECT status, total_amount INTO v_status, v_total
    FROM bookings
    WHERE booking_id = p_booking_id AND attendee_id = p_attendee_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        ROLLBACK;
        SET p_result = 'not_found';
        LEAVE proc_body;
    END IF;

    IF v_status <> 'held' OR v_expires IS NULL OR v_expires < NOW() THEN
        ROLLBACK;
        SET p_result = 'not_held';
        LEAVE proc_body;
    END IF;

    UPDATE bookings SET status = 'confirmed' WHERE booking_id = p_booking_id;

    UPDATE seats s
    JOIN booking_seats bs ON bs.seat_id = s.seat_id
    SET s.status = 'booked'
    WHERE bs.booking_id = p_booking_id;

    UPDATE seat_holds SET status = 'converted' WHERE booking_id = p_booking_id;

    INSERT INTO payments (booking_id, amount, payment_method, payment_status)
    VALUES (p_booking_id, v_total, p_payment_method, 'success');

    COMMIT;
    SET p_result = 'confirmed';
END$$

-- =====================================================================
-- FIX 3: hold_seats now rejects seat ids that don't exist for this event
-- (or duplicates), instead of silently booking only the ones it found.
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

DELIMITER ;

-- One-time cleanup: drop seat links left behind by bookings that already
-- expired or were cancelled under the old trigger (safe to re-run).
DELETE bs FROM booking_seats bs
JOIN bookings b ON b.booking_id = bs.booking_id
WHERE b.status IN ('expired', 'cancelled');
