USE event_booking;

-- =====================================================================
-- DML / QUERY SET FOR THE REPORT
-- Part A: INSERT / UPDATE / DELETE (each wrapped in a transaction that is
--         rolled back, so your real data is not changed)
-- Part B: SELECT queries covering JOIN, GROUP BY, HAVING, ORDER BY,
--         aggregates and subqueries
-- =====================================================================

-- ---------------------------------------------------------------------
-- PART A: INSERT / UPDATE / DELETE
-- ---------------------------------------------------------------------

-- A1. INSERT: add a new venue, then show it
START TRANSACTION;
INSERT INTO venues (name, address, city, capacity)
VALUES ('Kanteerava Indoor Stadium', '3 Kasturba Rd', 'Bengaluru', 4000);
SELECT venue_id, name, city, capacity FROM venues ORDER BY venue_id DESC LIMIT 1;
ROLLBACK;

-- A2. UPDATE: raise the base price of event 2 by 10%, show before and after
START TRANSACTION;
SELECT event_id, event_name, base_price FROM events WHERE event_id = 2;
UPDATE events SET base_price = base_price * 1.10 WHERE event_id = 2;
SELECT event_id, event_name, base_price FROM events WHERE event_id = 2;
ROLLBACK;

-- A3. DELETE: remove a pricing rule, show the rules left for event 1
START TRANSACTION;
DELETE FROM dynamic_pricing_rules WHERE event_id = 1 AND rule_name = 'High demand surcharge';
SELECT rule_id, rule_name, adjustment_type, adjustment_value, is_active
FROM dynamic_pricing_rules WHERE event_id = 1;
ROLLBACK;

-- ---------------------------------------------------------------------
-- PART B: SELECT QUERIES
-- ---------------------------------------------------------------------

-- Q1. JOIN (4 tables): every booking with attendee, event and venue
SELECT b.booking_id,
       u.name       AS attendee,
       e.event_name,
       v.name       AS venue,
       b.status,
       b.total_amount
FROM bookings b
JOIN attendees a ON a.attendee_id = b.attendee_id
JOIN users u     ON u.user_id     = a.user_id
JOIN events e    ON e.event_id    = b.event_id
JOIN venues v    ON v.venue_id    = e.venue_id
ORDER BY b.booking_id;

-- Q2. GROUP BY + aggregates: seats by status for each event
SELECT e.event_name,
       COUNT(*)                          AS total_seats,
       SUM(s.status = 'available')       AS available,
       SUM(s.status = 'held')            AS held,
       SUM(s.status = 'booked')          AS booked,
       ROUND(AVG(s.price), 2)            AS avg_base_price,
       MIN(s.price)                      AS min_price,
       MAX(s.price)                      AS max_price
FROM events e
JOIN seats s ON s.event_id = e.event_id
GROUP BY e.event_id, e.event_name
ORDER BY e.event_id;

-- Q3. GROUP BY + HAVING: events that have taken in more than 1000 in confirmed revenue
SELECT e.event_name,
       COUNT(DISTINCT b.booking_id) AS confirmed_bookings,
       SUM(p.amount)                AS revenue
FROM events e
JOIN bookings b ON b.event_id   = e.event_id AND b.status = 'confirmed'
JOIN payments p ON p.booking_id = b.booking_id AND p.payment_status = 'success'
GROUP BY e.event_id, e.event_name
HAVING SUM(p.amount) > 1000
ORDER BY revenue DESC;

-- Q4. ORDER BY + LIMIT: top attendees by total amount spent
SELECT u.name AS attendee,
       COUNT(b.booking_id)  AS bookings,
       SUM(b.total_amount)  AS total_spent
FROM bookings b
JOIN attendees a ON a.attendee_id = b.attendee_id
JOIN users u     ON u.user_id     = a.user_id
WHERE b.status = 'confirmed'
GROUP BY u.user_id, u.name
ORDER BY total_spent DESC
LIMIT 5;

-- Q5. HAVING on a section level: sections whose average seat price is above 1500
SELECT e.event_name, s.section,
       COUNT(*)              AS seats,
       ROUND(AVG(s.price),2) AS avg_price
FROM seats s
JOIN events e ON e.event_id = s.event_id
GROUP BY e.event_id, e.event_name, s.section
HAVING AVG(s.price) > 1500
ORDER BY avg_price DESC;

-- Q6. SUBQUERY (scalar): events priced above the average base price
SELECT event_id, event_name, base_price
FROM events
WHERE base_price > (SELECT AVG(base_price) FROM events);

-- Q7. SUBQUERY (NOT EXISTS): events that have no confirmed booking yet
SELECT e.event_id, e.event_name, e.event_date
FROM events e
WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.event_id = e.event_id AND b.status = 'confirmed'
);

-- Q8. SUBQUERY (IN): attendees who have paid by UPI
SELECT u.name, u.email
FROM users u
JOIN attendees a ON a.user_id = u.user_id
WHERE a.attendee_id IN (
    SELECT b.attendee_id
    FROM bookings b
    JOIN payments p ON p.booking_id = b.booking_id
    WHERE p.payment_method = 'upi' AND p.payment_status = 'success'
);

-- Q9. CORRELATED SUBQUERY: each event with its own count of booked seats
SELECT e.event_name,
       (SELECT COUNT(*) FROM seats s
        WHERE s.event_id = e.event_id AND s.status = 'booked') AS booked_seats
FROM events e
ORDER BY booked_seats DESC;

-- Q10. LEFT JOIN: every attendee with their booking count, including those with none
SELECT u.name,
       COUNT(b.booking_id) AS bookings
FROM attendees a
JOIN users u          ON u.user_id     = a.user_id
LEFT JOIN bookings b  ON b.attendee_id = a.attendee_id
GROUP BY a.attendee_id, u.name
ORDER BY bookings DESC;

-- Q11. Payments by method: count, total and average
SELECT payment_method,
       COUNT(*)              AS payments,
       SUM(amount)           AS total,
       ROUND(AVG(amount), 2) AS average
FROM payments
WHERE payment_status = 'success'
GROUP BY payment_method
ORDER BY total DESC;

-- Q12. Advanced feature 1: the stored function in a query (live dynamic prices)
SELECT seat_id, section, seat_type, status,
       price                         AS base_price,
       calculate_dynamic_price(seat_id) AS dynamic_price
FROM seats
WHERE event_id = 1
ORDER BY seat_id;

-- Q13. Advanced feature 2: the view (organizer sales dashboard)
SELECT * FROM organizer_sales_dashboard ORDER BY revenue DESC;

-- Q14. Advanced feature 3: the pricing rules in use, with their event
SELECT e.event_name, r.rule_name, r.adjustment_type, r.adjustment_value, r.is_active
FROM dynamic_pricing_rules r
JOIN events e ON e.event_id = r.event_id
ORDER BY e.event_id, r.rule_id;
