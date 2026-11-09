DROP DATABASE IF EXISTS event_booking;
CREATE DATABASE event_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_booking;

CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(150)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    role           VARCHAR(20)   NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login     DATETIME,
    CONSTRAINT chk_users_role   CHECK (role IN ('attendee', 'organizer', 'admin')),
    CONSTRAINT chk_users_status CHECK (status IN ('active', 'suspended'))
) ENGINE=InnoDB;

CREATE TABLE organizers (
    organizer_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    org_name      VARCHAR(150) NOT NULL,
    phone         VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendees (
    attendee_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    phone         VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admins (
    admin_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE venues (
    venue_id   INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    address    VARCHAR(255) NOT NULL,
    city       VARCHAR(100) NOT NULL,
    capacity   INT NOT NULL,
    CONSTRAINT chk_venues_capacity CHECK (capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE events (
    event_id      INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id  INT NOT NULL,
    venue_id      INT NOT NULL,
    event_name    VARCHAR(150) NOT NULL,
    event_date    DATE NOT NULL,
    event_time    TIME NOT NULL,
    base_price    DECIMAL(10,2) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE RESTRICT,
    CONSTRAINT chk_events_price  CHECK (base_price >= 0),
    CONSTRAINT chk_events_status CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled'))
) ENGINE=InnoDB;

CREATE TABLE seats (
    seat_id     INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    section     VARCHAR(50) NOT NULL,
    row_no      VARCHAR(10) NOT NULL,
    seat_no     INT NOT NULL,
    seat_type   VARCHAR(30) NOT NULL DEFAULT 'standard',
    price       DECIMAL(10,2) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'available',
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE KEY uq_seat_layout (event_id, section, row_no, seat_no),
    CONSTRAINT chk_seats_price  CHECK (price >= 0),
    CONSTRAINT chk_seats_status CHECK (status IN ('available', 'held', 'booked'))
) ENGINE=InnoDB;

CREATE TABLE dynamic_pricing_rules (
    rule_id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id          INT NOT NULL,
    rule_name         VARCHAR(100) NOT NULL,
    adjustment_type   VARCHAR(20) NOT NULL,
    adjustment_value  DECIMAL(10,2) NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT chk_dpr_type CHECK (adjustment_type IN ('percentage', 'flat'))
) ENGINE=InnoDB;

CREATE TABLE bookings (
    booking_id     INT AUTO_INCREMENT PRIMARY KEY,
    attendee_id    INT NOT NULL,
    event_id       INT NOT NULL,
    booking_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(20) NOT NULL DEFAULT 'held',
    total_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendee_id) REFERENCES attendees(attendee_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT chk_bookings_status CHECK (status IN ('held', 'confirmed', 'cancelled', 'expired')),
    CONSTRAINT chk_bookings_amount CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE booking_seats (
    booking_id        INT NOT NULL,
    seat_id           INT NOT NULL,
    price_at_booking  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (booking_id, seat_id),
    UNIQUE KEY uq_seat_once (seat_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE CASCADE,
    CONSTRAINT chk_bs_price CHECK (price_at_booking >= 0)
) ENGINE=InnoDB;

CREATE TABLE seat_holds (
    hold_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id  INT NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT chk_holds_status CHECK (status IN ('active', 'released', 'converted'))
) ENGINE=InnoDB;

CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(30) NOT NULL,
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT chk_payments_status CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded'))
) ENGINE=InnoDB;

CREATE INDEX idx_events_venue_date  ON events(venue_id, event_date);
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_bookings_event     ON bookings(event_id, status);
CREATE INDEX idx_payments_booking   ON payments(booking_id, payment_status);
CREATE INDEX idx_seatholds_expiry   ON seat_holds(status, expires_at);
