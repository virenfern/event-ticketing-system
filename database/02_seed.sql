USE event_booking;

-- Users (password_hash values are placeholder bcrypt-shaped strings for seeding;
-- the real app must hash passwords with bcrypt/argon2 before insert, never store plain text)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Priya Nair',      'priya.organizer@example.com', '$2b$10$placeholderhash0000000000000000000000000001', 'organizer'),
  ('Rahul Mehta',     'rahul.organizer@example.com', '$2b$10$placeholderhash0000000000000000000000000002', 'organizer'),
  ('Sakshi Ghodke',   'sakshi.attendee@example.com', '$2b$10$placeholderhash0000000000000000000000000003', 'attendee'),
  ('Viren Fernandes', 'viren.attendee@example.com',  '$2b$10$placeholderhash0000000000000000000000000004', 'attendee'),
  ('Admin User',      'admin@example.com',           '$2b$10$placeholderhash0000000000000000000000000005', 'admin');

INSERT INTO organizers (user_id, org_name, phone) VALUES
  (1, 'Neon Nights Productions', '9900011111'),
  (2, 'FutureTech Events', '9900022222');

INSERT INTO attendees (user_id, phone) VALUES
  (3, '9900033333'),
  (4, '9900044444');

INSERT INTO admins (user_id) VALUES (5);

INSERT INTO venues (name, address, city, capacity) VALUES
  ('Palace Grounds Arena', '1 Palace Rd', 'Bengaluru', 5000),
  ('Bangalore International Centre', '2 Domlur Ave', 'Bengaluru', 800);

INSERT INTO events (organizer_id, venue_id, event_name, event_date, event_time, base_price, status) VALUES
  (1, 1, 'Neon Nights Music Festival', '2026-11-21', '19:00:00', 1499.00, 'scheduled'),
  (2, 2, 'FutureTech Summit 2026',     '2026-11-25', '09:30:00',  999.00, 'scheduled');

-- Seats for event 1: 2 sections x small grid, kept short on purpose for easy testing
INSERT INTO seats (event_id, section, row_no, seat_no, seat_type, price, status) VALUES
  (1, 'A', '1', 1, 'vip', 2500.00, 'available'),
  (1, 'A', '1', 2, 'vip', 2500.00, 'available'),
  (1, 'A', '1', 3, 'vip', 2500.00, 'available'),
  (1, 'B', '1', 1, 'standard', 1499.00, 'available'),
  (1, 'B', '1', 2, 'standard', 1499.00, 'available'),
  (1, 'B', '1', 3, 'standard', 1499.00, 'available');

INSERT INTO seats (event_id, section, row_no, seat_no, seat_type, price, status) VALUES
  (2, 'A', '1', 1, 'standard', 999.00, 'available'),
  (2, 'A', '1', 2, 'standard', 999.00, 'available'),
  (2, 'A', '1', 3, 'standard', 999.00, 'available');

INSERT INTO dynamic_pricing_rules (event_id, rule_name, adjustment_type, adjustment_value, is_active) VALUES
  (1, 'Early bird discount', 'percentage', -10.00, TRUE),
  (1, 'High demand surcharge', 'percentage', 15.00, FALSE),
  (2, 'Last-minute surcharge', 'flat', 100.00, FALSE);
