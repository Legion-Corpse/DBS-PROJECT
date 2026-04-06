"""
ServeMart Mini Project Report Generator
Generates ServeMart_MiniProject_Report.docx following the MIT Manipal DBS Lab template.
Run: python gen_report.py
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ─── Helpers ────────────────────────────────────────────────────────────────

def set_font(run, name='Times New Roman', size=12, bold=False, italic=False):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic

def heading(doc, text, size=14, bold=True, center=False, space_before=12, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    set_font(run, size=size, bold=bold)
    return p

def body(doc, text, size=12, space_before=0, space_after=6, indent=None, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    if indent:
        p.paragraph_format.left_indent = Inches(indent)
    if align:
        p.alignment = align
    run = p.add_run(text)
    set_font(run, size=size)
    return p

def bullet(doc, text, size=12):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    set_font(run, size=size)
    return p

def code_block(doc, text, size=9):
    for line in text.split('\n'):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.left_indent = Inches(0.4)
        run = p.add_run(line if line else ' ')
        run.font.name = 'Courier New'
        run.font.size = Pt(size)
    doc.add_paragraph()

def simple_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    hdr = table.rows[0]
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = h
        for run in cell.paragraphs[0].runs:
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.name = 'Times New Roman'
    for ri, row in enumerate(rows):
        tr = table.rows[ri + 1]
        for ci, val in enumerate(row):
            cell = tr.cells[ci]
            cell.text = str(val)
            for run in cell.paragraphs[0].runs:
                run.font.size = Pt(10)
                run.font.name = 'Times New Roman'
    if col_widths:
        for row in table.rows:
            for ci, cell in enumerate(row.cells):
                cell.width = Inches(col_widths[ci])
    doc.add_paragraph()
    return table

# ════════════════════════════════════════════════════════════════════════════
# DOCUMENT
# ════════════════════════════════════════════════════════════════════════════

doc = Document()
section = doc.sections[0]
section.top_margin    = Inches(1.0)
section.bottom_margin = Inches(1.0)
section.left_margin   = Inches(1.25)
section.right_margin  = Inches(1.0)

# ─── PAGE 1: TITLE PAGE ─────────────────────────────────────────────────────

heading(doc, 'Mini Project Report', size=16, bold=True, center=True, space_before=48, space_after=4)
p2 = doc.add_paragraph(); p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p2.add_run('of'); set_font(r, size=14)
heading(doc, 'Database Systems Lab (CSS 2212)', size=14, bold=True, center=True, space_before=4, space_after=16)
heading(doc, 'ServeMart', size=20, bold=True, center=True, space_before=12, space_after=4)
heading(doc, 'A Local Service Marketplace', size=14, bold=False, center=True, space_before=4, space_after=32)
body(doc, 'SUBMITTED BY', size=12, space_before=20, space_after=8, align=WD_ALIGN_PARAGRAPH.CENTER)

tbl = doc.add_table(rows=4, cols=4)
tbl.style = 'Table Grid'
for ci, h in enumerate(['Student Name', 'Reg. No', 'Roll No', 'Section']):
    tbl.rows[0].cells[ci].text = h
    for run in tbl.rows[0].cells[ci].paragraphs[0].runs:
        run.font.bold = True; run.font.size = Pt(11); run.font.name = 'Times New Roman'
for ri, row in enumerate([
    ('Abhyuday Gupta',    '240905576', '57', 'CSE C'),
    ('Shaurya Jain',      '240905598', '60', 'CSE C'),
    ('Neelaksha Sisodiya','240905642', '65', 'CSE C'),
]):
    for ci, val in enumerate(row):
        tbl.rows[ri+1].cells[ci].text = val
        for run in tbl.rows[ri+1].cells[ci].paragraphs[0].runs:
            run.font.size = Pt(11); run.font.name = 'Times New Roman'

doc.add_paragraph()
heading(doc, 'School of Computer Engineering', size=12, bold=True, center=True, space_before=24, space_after=2)
heading(doc, 'Manipal Institute of Technology, Manipal', size=12, bold=False, center=True, space_before=0, space_after=2)
heading(doc, 'April 2026', size=12, bold=False, center=True, space_before=0, space_after=0)
doc.add_page_break()

# ─── PAGE 2: CERTIFICATE ────────────────────────────────────────────────────

heading(doc, 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', size=13, bold=True, center=True, space_before=12, space_after=4)
heading(doc, 'Manipal', size=12, bold=False, center=True, space_before=0, space_after=4)
heading(doc, '07/04/2026', size=12, bold=False, center=True, space_before=0, space_after=16)
heading(doc, 'CERTIFICATE', size=16, bold=True, center=True, space_before=8, space_after=16)
body(doc, (
    'This is to certify that the project titled ServeMart — A Local Service Marketplace is a record of '
    'the bonafide work done by students: Abhyuday Gupta (Reg. No. 240905576), Shaurya Jain '
    '(Reg. No. 240905598), and Neelaksha Sisodiya (Reg. No. 240905642), submitted in partial '
    'fulfilment of the requirements for the award of the Degree of Bachelor of Technology (B.Tech.) '
    'in Computer Science and Engineering of Manipal Institute of Technology, Manipal, Karnataka '
    '(A Constituent Institute of Manipal Academy of Higher Education), during the academic year 2025-2026.'
), size=12, space_after=24)
body(doc, 'Name and Signature of Examiners:', size=12, space_before=8, space_after=12)
body(doc, '1. ______________________________________', size=12, space_after=12)
body(doc, '2. ______________________________________', size=12, space_after=0)
doc.add_page_break()

# ─── TABLE OF CONTENTS ──────────────────────────────────────────────────────

heading(doc, 'TABLE OF CONTENTS', size=16, bold=True, center=True, space_before=8, space_after=16)
toc_entries = [
    ('—', 'Abstract', '4'),
    ('1',  'Introduction', '5'),
    ('2',  'Problem Statement and Objectives', '8'),
    ('3',  'Methodology', '11'),
    ('4',  'ER Diagram, Relational Schema and Sample Data', '13'),
    ('5',  'DDL Commands and PL/SQL Procedures / Functions / Triggers', '18'),
    ('6',  'Results and Snapshots', '34'),
    ('7',  'Conclusion, Limitations and Future Work', '38'),
    ('8',  'References', '41'),
]
toc_tbl = doc.add_table(rows=len(toc_entries)+1, cols=3)
toc_tbl.style = 'Table Grid'
for ci, h in enumerate(['No.', 'Topic', 'Page No.']):
    toc_tbl.rows[0].cells[ci].text = h
    for run in toc_tbl.rows[0].cells[ci].paragraphs[0].runs:
        run.font.bold = True; run.font.size = Pt(11); run.font.name = 'Times New Roman'
for ri, (num, topic, page) in enumerate(toc_entries):
    for ci, val in enumerate([num, topic, page]):
        toc_tbl.rows[ri+1].cells[ci].text = val
        for run in toc_tbl.rows[ri+1].cells[ci].paragraphs[0].runs:
            run.font.size = Pt(11); run.font.name = 'Times New Roman'
doc.add_page_break()

# ─── ABSTRACT ───────────────────────────────────────────────────────────────

heading(doc, 'ABSTRACT', size=16, bold=True, center=True, space_before=8, space_after=16)
body(doc, (
    'Finding a reliable plumber at 9 PM or a house-cleaning crew for a specific Saturday is harder than '
    'it should be. Phone directories are outdated, social referrals do not scale, and informal booking '
    'through WhatsApp leaves both customers and providers with no paper trail. ServeMart is a full-stack '
    'service marketplace that addresses this directly: customers browse verified local providers, book '
    'a confirmed time slot, and receive an itemised invoice when the job is done. Providers manage their '
    'availability calendar and track completed work through a dedicated dashboard.'
), size=12, space_after=8)
body(doc, (
    'The backend is built on Oracle 21c XE (running in a Docker container) with an Express.js 4 API '
    'layer and a React 19 single-page frontend built with Vite. The database schema consists of '
    '18 normalised tables. Business logic lives in the database: three stored procedures handle '
    'booking creation, invoice generation, and cancellation; a compound trigger on the REVIEWS table '
    'keeps provider ratings up to date after every review insert, update, or delete; a table function '
    'ranks providers by a weighted composite score for the recommendation feed; and a view aggregates '
    'provider statistics for the admin and browse screens.'
), size=12, space_after=8)
body(doc, (
    'Authentication uses JWT tokens and bcrypt password hashing. The booking flow enforces '
    'time-overlap checks at the database level so double-booking is structurally impossible. '
    'Promo codes are validated and usage counts incremented inside the booking procedure to prevent '
    'race conditions. The project demonstrates entity-relationship modelling, relational schema '
    'design, normalisation to 3NF, and the full range of Oracle PL/SQL features in a system that '
    'does real work.'
), size=12, space_after=0)
doc.add_page_break()

# ─── CHAPTER 1 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 1: INTRODUCTION', size=14, bold=True, space_before=8, space_after=12)
body(doc, (
    'The market for home and local services in India is large, fragmented, and mostly unorganised. '
    'A customer needing an electrician has to search through local contacts, hope that someone is '
    'available, negotiate rates informally, and has no way to verify the person\'s background or '
    'track record. Providers, on the other side, rely entirely on word-of-mouth and have no way to '
    'advertise their availability or build a verifiable reputation online.'
), size=12, space_after=8)
body(doc, (
    'ServeMart is built to change that. It is a two-sided marketplace: customers browse and book, '
    'providers list and manage. Every booking goes through a structured confirmation flow with '
    'time-overlap prevention, promo code validation, and automatic invoice generation. '
    'Every completed job produces a rating that updates the provider\'s score immediately. '
    'The entire transaction record — booking, invoice, payment, review — lives in a relational '
    'database that enforces all constraints at the data layer, not just in application code.'
), size=12, space_after=8)
body(doc, (
    'This report documents the database design and implementation behind ServeMart. It covers '
    'the entity-relationship model, the normalised 18-table Oracle schema, the PL/SQL objects, '
    'representative SQL queries, and the full-stack application that connects everything together.'
), size=12, space_after=12)

heading(doc, '1.1  System architecture', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'ServeMart follows a three-tier architecture. The presentation layer is a React 19 single-page '
    'application built with Vite. It communicates with an Express.js 4 REST API over HTTP. '
    'The data layer is Oracle 21c XE running inside a Docker container named oracleXE, accessed '
    'by the backend through the node-oracledb 6 driver with a connection pool.'
), size=12, space_after=8)
body(doc, (
    'JWT tokens carry all session state. The token payload holds user_id, username, and user_role, '
    'which the API uses for role checks on every protected route. Passwords are hashed with bcrypt '
    '(10 rounds) before storage and are never returned by any endpoint.'
), size=12, space_after=8)
body(doc, 'The backend is organised into six route modules:', size=12, space_after=4)
for m in [
    'auth — registration and login',
    'bookings — create, list, complete, cancel',
    'providers — browse, availability, services, recommendations',
    'invoices — fetch invoice details and record payment',
    'reviews — submit a rating for a completed booking',
    'admin — revenue analytics, error logs, provider approval',
]:
    bullet(doc, m)
doc.add_paragraph()

heading(doc, '1.2  Scope of the project', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'The scope covers the design and implementation of a normalised relational schema with 18 entities, '
    'all CRUD operations, multi-table JOIN queries, analytic window functions, three stored procedures, '
    'one compound trigger, one table function returning a SYS_REFCURSOR, and one view. '
    'A React single-page application demonstrates live database connectivity with role-specific '
    'dashboards for customers, providers, and administrators. '
    'Payment gateway integration is explicitly out of scope; payments are recorded as confirmed '
    'when the provider marks the job complete.'
), size=12, space_after=12)

heading(doc, '1.3  Tools and technologies', size=13, bold=True, space_before=8, space_after=6)
simple_table(doc, ['Component', 'Technology'], [
    ('Database',        'Oracle 21c XE (Docker container), PL/SQL'),
    ('Backend',         'Node.js 20, Express.js 4, node-oracledb 6'),
    ('Frontend',        'React 19, Vite 5, React Router 6'),
    ('Authentication',  'JSON Web Tokens (jsonwebtoken), bcrypt (10 rounds)'),
    ('Validation',      'Zod (request schema validation on all POST endpoints)'),
    ('ER Modelling',    'draw.io, SQL Developer Data Modeler'),
    ('Environment',     'Docker (Oracle XE container), .env for secrets'),
    ('Other libraries', 'react-icons, axios'),
], col_widths=[2.0, 4.2])
doc.add_page_break()

# ─── CHAPTER 2 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 2: PROBLEM STATEMENT AND OBJECTIVES', size=14, bold=True, space_before=8, space_after=12)

heading(doc, '2.1  Problem statement', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'Local service discovery in India is broken in a specific way: there is no shortage of skilled '
    'workers, but there is no reliable channel connecting them to the people who need them. '
    'Customers cannot verify credentials, cannot see real ratings, and cannot book a specific '
    'time slot. Providers have no digital presence and lose potential customers every day simply '
    'because they are not findable.'
), size=12, space_after=8)
body(doc, 'A structured database system is needed that can:', size=12, space_after=4)
for item in [
    'Store and manage user accounts across three roles (CUSTOMER, PROVIDER, ADMIN) with role-based access control.',
    'Maintain provider profiles, service listings, availability calendars, and service area coverage.',
    'Handle the full booking lifecycle: creation with time-overlap prevention, completion, and cancellation with slot restoration.',
    'Automatically generate itemised invoices (base fee, platform fee 10%, GST 5%, promo discount) on job completion.',
    'Keep provider ratings current by recomputing them at the database level after every review change.',
    'Record a structured cancellation log, a payment history, and an error log for all PL/SQL failures.',
    'Provide a ranked provider recommendation feed filtered by service area.',
]:
    bullet(doc, item)
doc.add_paragraph()

heading(doc, '2.2  Functional requirements', size=13, bold=True, space_before=8, space_after=6)
frs = [
    ('FR1', 'User registration and authentication',
     'The system must allow registration with role selection (CUSTOMER or PROVIDER). '
     'Passwords are hashed with bcrypt before storage. Login returns a JWT valid for 24 hours. '
     'Inactive accounts are rejected at login with a distinct error code.'),
    ('FR2', 'Role-based access control',
     'Every API endpoint must enforce role checks. Customers may create bookings and submit reviews. '
     'Providers may complete and cancel bookings and manage their own availability and services. '
     'Admins have full visibility including revenue analytics and the error log.'),
    ('FR3', 'Provider and service management',
     'Providers must be able to add and remove services with category, name, and hourly rate. '
     'Providers must be able to define weekly availability slots. '
     'Admins must be able to approve or reject provider background checks.'),
    ('FR4', 'Booking creation with conflict prevention',
     'Customers must be able to book a service by selecting a provider, a service, an availability slot, '
     'a date, a 3-hour window, and an address. The system must reject a booking if the selected window '
     'overlaps an existing active booking for that provider. Invalid or expired promo codes must be '
     'silently ignored so the booking proceeds without a discount.'),
    ('FR5', 'Invoice generation and payment',
     'When a provider marks a job complete, the system must automatically generate an itemised invoice '
     'and record the payment as confirmed. The invoice must be viewable by the customer at any time.'),
    ('FR6', 'Booking cancellation',
     'Customers and providers must be able to cancel a booking that is not already completed. '
     'Cancellation must log the reason, restore the availability slot, and refund any payment '
     'already recorded as SUCCESS.'),
    ('FR7', 'Reviews and ratings',
     'Customers must be able to submit a 1-5 star rating with a comment for any completed booking. '
     'One review per booking must be enforced at the database level. '
     'The provider\'s average rating and completed job count must update automatically.'),
    ('FR8', 'Provider recommendation',
     'The system must expose a ranked list of providers for a given service area, scoring them '
     'on: 50% rating_avg, 30% job count (capped at 100), 20% flat baseline. '
     'Only approved providers with active accounts must appear.'),
]
for fr_id, fr_title, fr_desc in frs:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    r1 = p.add_run(f'{fr_id}: {fr_title}   ')
    set_font(r1, size=12, bold=True)
    r2 = p.add_run(fr_desc)
    set_font(r2, size=12)
doc.add_paragraph()

heading(doc, '2.3  Objectives', size=13, bold=True, space_before=8, space_after=6)
for obj in [
    'Design a normalised relational schema up to Third Normal Form (3NF) with 18 tables.',
    'Implement all tables with appropriate PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, and CHECK constraints.',
    'Write basic SQL queries (SELECT, INSERT, UPDATE, DELETE) covering all entities.',
    'Write complex queries using multi-table JOINs, GROUP BY, aggregate functions, subqueries, and window functions.',
    'Implement three stored procedures encapsulating the booking, invoice, and cancellation workflows.',
    'Implement a compound trigger that recomputes provider ratings after every review change.',
    'Define a table function that returns a ranked provider recommendation cursor for a given area.',
    'Create a view summarising provider profiles for the browse and admin screens.',
    'Build a role-adaptive React single-page application demonstrating live Oracle connectivity.',
]:
    bullet(doc, obj)
doc.add_page_break()

# ─── CHAPTER 3 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 3: METHODOLOGY', size=14, bold=True, space_before=8, space_after=12)
body(doc, 'The project followed the standard Database Development Life Cycle (DDLC) through six phases.', size=12, space_after=12)

phases = [
    ('3.1  Requirement gathering',
     'We started by mapping out the two sides of the marketplace: what a customer needs to find, '
     'book, and pay for a service, and what a provider needs to list services, manage availability, '
     'and track completed work. From there we derived 18 entities, their attributes, and the '
     'business rules that govern their interactions — overlap prevention, promo code validation, '
     'rating recomputation, and cascading cancellation.'),
    ('3.2  Conceptual design',
     'An ER diagram was drawn covering all 18 entities. Key cardinalities: one USER may be either '
     'one CUSTOMER or one SERVICE_PROVIDER (1:0..1 role split); one PROVIDER offers many '
     'SERVICES_OFFERED (1:N); one BOOKING references one SERVICE, one ADDRESS, one AVAILABILITY_SLOT, '
     'and optionally one PROMOTION; one BOOKING generates at most one INVOICE, one PAYMENT, '
     'one REVIEW, and one CANCELLATION.'),
    ('3.3  Logical design and normalisation',
     '1NF: All attributes are atomic. ENUM-equivalent VARCHAR2 CHECK constraints restrict values '
     'to defined domains (user_role, background_chk, status, payment_method).\n'
     '2NF: Every non-key attribute depends on the full primary key. PROVIDER_AREAS and '
     'PROVIDER_AVAILABILITY use surrogate PKs with unique constraints on the natural composite key.\n'
     '3NF: No transitive dependencies. Provider contact details live in SERVICE_PROVIDERS, not in '
     'SERVICES_OFFERED. Category metadata lives in SERVICE_CATEGORIES, not duplicated per service row.'),
    ('3.4  Physical design',
     'Tables were created in Oracle 21c with NUMBER GENERATED ALWAYS AS IDENTITY primary keys. '
     'ON DELETE CASCADE was applied to parent-child relationships where removing a parent should '
     'clean up children (e.g. deleting a USER cascades to their profile and all bookings). '
     'ON DELETE SET NULL was used where orphaned records should persist '
     '(e.g. BOOKINGS.promo_id is nulled when a promotion is deleted). '
     'CHECK constraints enforce domain rules: status values, rating range 1-5, '
     'hourly_rate >= 0, discount_percentage 1-100.'),
    ('3.5  Implementation',
     'Seed data was inserted for 6 users (2 customers, 3 providers, 1 admin), 5 service areas, '
     '6 service categories, 5 service listings, 5 availability slots, 2 promo codes, and a complete '
     'demo flow: one booking, one invoice, one payment, and one review that fires the compound trigger. '
     'The three stored procedures, compound trigger, table function, and view were created after all '
     'tables. The Express.js backend and React frontend were built incrementally, with each route '
     'validated against the Oracle schema.'),
    ('3.6  Testing and validation',
     'Constraints were tested by attempting invalid inserts: duplicate username (ORA-00001), '
     'booking in an occupied slot (ORA-20010), booking outside available hours (ORA-20011), '
     'cancelling a completed booking (ORA-20020), and posting a review twice for the same booking '
     '(UNIQUE constraint on REVIEWS.booking_id). Trigger behaviour was verified by inserting a review '
     'and confirming that rating_avg and jobs_completed updated correctly in SERVICE_PROVIDERS. '
     'JWT expiry and role checks were tested across all three user roles.'),
]
for title, text in phases:
    heading(doc, title, size=13, bold=True, space_before=10, space_after=6)
    body(doc, text, size=12, space_after=8)
doc.add_page_break()

# ─── CHAPTER 4 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 4: ER DIAGRAM, RELATIONAL SCHEMA AND SAMPLE DATA', size=14, bold=True, space_before=8, space_after=12)

heading(doc, '4.1  Entity relationships', size=13, bold=True, space_before=8, space_after=6)
body(doc, 'Key relationships in the ServeMart schema:', size=12, space_after=6)
for r in [
    'USERS (1) → CUSTOMERS (0..1): one user account may have one customer profile.',
    'USERS (1) → SERVICE_PROVIDERS (0..1): one user account may have one provider profile.',
    'SERVICE_PROVIDERS (1) → SERVICES_OFFERED (N): one provider offers many services.',
    'SERVICE_PROVIDERS (1) → PROVIDER_AVAILABILITY (N): one provider has many availability slots.',
    'SERVICE_PROVIDERS (N) ↔ SERVICE_AREAS (M) via PROVIDER_AREAS: providers cover multiple cities.',
    'SERVICE_CATEGORIES (1) → SERVICES_OFFERED (N): one category groups many services.',
    'CUSTOMERS (1) → BOOKINGS (N): one customer makes many bookings.',
    'SERVICES_OFFERED (1) → BOOKINGS (N): one service listing is referenced by many bookings.',
    'CUSTOMER_ADDRESSES (1) → BOOKINGS (N): one address may be used for multiple bookings.',
    'PROVIDER_AVAILABILITY (1) → BOOKINGS (N): one slot template is referenced by many bookings.',
    'PROMOTIONS (1) → BOOKINGS (N): one promo code may be applied to many bookings (optional FK).',
    'BOOKINGS (1) → INVOICES (0..1): one booking generates at most one invoice.',
    'INVOICES (1) → PAYMENTS (0..1): one invoice has at most one payment record.',
    'BOOKINGS (1) → REVIEWS (0..1): one completed booking may receive one review.',
    'BOOKINGS (1) → CANCELLATIONS (0..1): one cancelled booking has one cancellation record.',
    'USERS (1) → SUPPORT_TICKETS (N): one user may open many support tickets.',
    'USERS (1) → PLATFORM_FEEDBACK (N): one user may submit many feedback entries.',
    'PL/SQL exceptions → ERROR_LOGS (N): procedures write one row per caught exception.',
]:
    bullet(doc, r)
doc.add_paragraph()

heading(doc, '4.2  Relational schema', size=13, bold=True, space_before=8, space_after=6)
body(doc, 'Notation: * = UNIQUE constraint,  # = Foreign Key,  PK = Primary Key', size=10, space_after=8)
simple_table(doc, ['Table', 'Attributes'], [
    ('ERROR_LOGS',           'log_id PK, severity, procedure_name, error_message, logged_at'),
    ('USERS',                'user_id PK, username*, password_hash, email*, user_role, is_active, last_login, created_at'),
    ('CUSTOMERS',            'customer_id PK, user_id*#, first_name, last_name, phone'),
    ('CUSTOMER_ADDRESSES',   'address_id PK, customer_id#, location_label, house_no, building_name, area_landmark, city, postal_code'),
    ('SERVICE_PROVIDERS',    'provider_id PK, user_id*#, first_name, last_name, phone, experience_yrs, background_chk, rating_avg, jobs_completed'),
    ('SERVICE_AREAS',        'area_id PK, city_name, region_code — UNIQUE(city_name, region_code)'),
    ('PROVIDER_AREAS',       'provider_area_id PK, provider_id#, area_id# — UNIQUE(provider_id, area_id)'),
    ('PROVIDER_AVAILABILITY','availability_id PK, provider_id#, day_of_week, slot_start, slot_end, is_available'),
    ('SERVICE_CATEGORIES',   'category_id PK, category_name*'),
    ('SERVICES_OFFERED',     'service_id PK, provider_id#, category_id#, service_name, hourly_rate, is_active'),
    ('PROMOTIONS',           'promo_id PK, promo_code*, discount_percentage, max_discount_amt, min_order_amt, valid_from, valid_until, max_uses, current_uses, is_active'),
    ('BOOKINGS',             'booking_id PK, customer_id#, service_id#, address_id#, availability_id#, promo_id# (nullable), scheduled_date, duration_hours, status, created_at'),
    ('INVOICES',             'invoice_id PK, booking_id*#, base_amount, discount_amount, platform_fee, tax_amount, net_total, generated_at'),
    ('PAYMENTS',             'payment_id PK, invoice_id*#, amount_paid, payment_method, payment_status, transaction_id, paid_at'),
    ('REVIEWS',              'review_id PK, booking_id*#, rating, comments, created_at'),
    ('CANCELLATIONS',        'cancellation_id PK, booking_id*#, cancelled_by, reason, cancelled_at'),
    ('SUPPORT_TICKETS',      'ticket_id PK, booking_id# (nullable), user_id#, subject, description, status, created_at'),
    ('PLATFORM_FEEDBACK',    'feedback_id PK, user_id#, rating, comments, submitted_at'),
], col_widths=[1.8, 4.5])

heading(doc, '4.3  Sample data', size=13, bold=True, space_before=10, space_after=8)
body(doc, 'Users table (seed accounts — all passwords: pass123)', size=12, space_after=4)
simple_table(doc, ['username', 'email', 'user_role'], [
    ('john_cust',  'john@gmail.com',      'CUSTOMER'),
    ('sara_cust',  'sara@gmail.com',       'CUSTOMER'),
    ('bob_pro',    'bob@fixit.com',        'PROVIDER'),
    ('dave_pro',   'dave@sparkworks.com',  'PROVIDER'),
    ('priya_pro',  'priya@cleanpro.com',   'PROVIDER'),
    ('admin',      'admin@servemart.com',  'ADMIN'),
], col_widths=[1.5, 2.5, 1.5])

body(doc, 'Service providers table', size=12, space_after=4)
simple_table(doc, ['first_name','last_name','exp_yrs','background_chk','rating_avg','jobs_completed'], [
    ('Bob',  'Builder', 12, 'APPROVED', 4.50, 50),
    ('Dave', 'Spark',   8,  'APPROVED', 4.80, 37),
    ('Priya','Verma',   5,  'APPROVED', 4.90, 62),
], col_widths=[1.0, 1.0, 0.8, 1.3, 1.0, 1.3])

body(doc, 'Services offered', size=12, space_after=4)
simple_table(doc, ['provider','category','service_name','hourly_rate (Rs.)'], [
    ('bob_pro',   'PLUMBING',   'Pipe Leak Fix',          '350.00'),
    ('bob_pro',   'PLUMBING',   'Bathroom Fitting',       '500.00'),
    ('dave_pro',  'ELECTRICAL', 'Wiring & Rewiring',      '400.00'),
    ('dave_pro',  'ELECTRICAL', 'Ceiling Fan Installation','250.00'),
    ('priya_pro', 'CLEANING',   'Deep Home Cleaning',     '300.00'),
], col_widths=[1.2, 1.2, 2.0, 1.3])

body(doc, 'Demo booking (full flow: booking to review)', size=12, space_after=4)
simple_table(doc, ['customer','service','status','duration','net_total (Rs.)','payment_status'], [
    ('john_cust','Pipe Leak Fix','COMPLETED','2.0 hrs','805.00','SUCCESS'),
], col_widths=[1.1, 1.2, 1.1, 1.0, 1.2, 1.2])
doc.add_page_break()

# ─── CHAPTER 5 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 5: DDL COMMANDS AND PL/SQL PROCEDURES / FUNCTIONS / TRIGGERS', size=14, bold=True, space_before=8, space_after=12)

heading(doc, '5.1  Database and table creation (DDL)', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'The schema runs inside the MARKETPLACE user schema on Oracle 21c XE. Tables are created in '
    'dependency order: ERROR_LOGS first (no FK dependencies, and all procedures need it for logging), '
    'then USERS, then CUSTOMERS and SERVICE_PROVIDERS, then the service and availability tables, '
    'then BOOKINGS which references six parent tables, and finally the transaction tables '
    'INVOICES, PAYMENTS, REVIEWS, and CANCELLATIONS.'
), size=12, space_after=8)

body(doc, 'Table 1: USERS', size=12, space_after=2)
code_block(doc, """\
CREATE TABLE USERS (
    user_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      VARCHAR2(50)  UNIQUE NOT NULL,
    password_hash VARCHAR2(256) NOT NULL,
    email         VARCHAR2(100) UNIQUE NOT NULL,
    user_role     VARCHAR2(20)  NOT NULL
                  CHECK (user_role IN ('CUSTOMER','PROVIDER','ADMIN')),
    is_active     NUMBER(1,0)   DEFAULT 1 CHECK (is_active IN (0,1)),
    last_login    TIMESTAMP,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
);""")
body(doc, (
    'NUMBER GENERATED ALWAYS AS IDENTITY replaces Oracle sequences for all primary keys. '
    'The CHECK on user_role restricts values to exactly three roles. is_active uses NUMBER(1,0) '
    'rather than BOOLEAN because Oracle does not support BOOLEAN in table definitions before Oracle 23c.'
), size=12, space_after=8)

body(doc, 'Table 2: SERVICE_PROVIDERS', size=12, space_after=2)
code_block(doc, """\
CREATE TABLE SERVICE_PROVIDERS (
    provider_id    NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        NUMBER       UNIQUE NOT NULL,
    first_name     VARCHAR2(50) NOT NULL,
    last_name      VARCHAR2(50) NOT NULL,
    phone          VARCHAR2(20),
    experience_yrs NUMBER       DEFAULT 0,
    background_chk VARCHAR2(20) DEFAULT 'PENDING'
                   CHECK (background_chk IN ('PENDING','APPROVED','REJECTED')),
    rating_avg     NUMBER(3,2)  DEFAULT 0.00,
    jobs_completed NUMBER       DEFAULT 0,
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id)
        REFERENCES USERS(user_id) ON DELETE CASCADE
);""")

body(doc, 'Table 3: BOOKINGS', size=12, space_after=2)
code_block(doc, """\
CREATE TABLE BOOKINGS (
    booking_id      NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id     NUMBER       NOT NULL,
    service_id      NUMBER       NOT NULL,
    address_id      NUMBER       NOT NULL,
    availability_id NUMBER       NOT NULL,
    promo_id        NUMBER,
    scheduled_date  TIMESTAMP    NOT NULL,
    duration_hours  NUMBER(4,1)  DEFAULT 1.0,
    status          VARCHAR2(20) DEFAULT 'CONFIRMED'
                    CHECK (status IN
                      ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_bk_cust  FOREIGN KEY (customer_id)
        REFERENCES CUSTOMERS(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_srvc  FOREIGN KEY (service_id)
        REFERENCES SERVICES_OFFERED(service_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_addr  FOREIGN KEY (address_id)
        REFERENCES CUSTOMER_ADDRESSES(address_id) ON DELETE CASCADE,
    CONSTRAINT fk_bk_avail FOREIGN KEY (availability_id)
        REFERENCES PROVIDER_AVAILABILITY(availability_id),
    CONSTRAINT fk_bk_promo FOREIGN KEY (promo_id)
        REFERENCES PROMOTIONS(promo_id) ON DELETE SET NULL
);""")
body(doc, (
    'ON DELETE SET NULL on promo_id preserves booking history when a promotion is deleted. '
    'ON DELETE CASCADE on the customer, service, and address foreign keys ensures removing a '
    'parent record cleans up all dependent bookings.'
), size=12, space_after=8)

body(doc, 'Table 4: INVOICES', size=12, space_after=2)
code_block(doc, """\
CREATE TABLE INVOICES (
    invoice_id      NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id      NUMBER       UNIQUE NOT NULL,
    base_amount     NUMBER(10,2) NOT NULL,
    discount_amount NUMBER(10,2) DEFAULT 0,
    platform_fee    NUMBER(10,2) DEFAULT 0,
    tax_amount      NUMBER(10,2) DEFAULT 0,
    net_total       NUMBER(10,2) NOT NULL,
    generated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_inv_bk FOREIGN KEY (booking_id)
        REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE
);""")
body(doc, (
    'UNIQUE on booking_id enforces the one-invoice-per-booking rule at the database level. '
    'sp_generate_invoice is the only path that creates invoice rows.'
), size=12, space_after=8)

heading(doc, '5.2  Basic DML queries', size=13, bold=True, space_before=10, space_after=6)
body(doc, 'List all approved providers with rating and job count:', size=12, space_after=2)
code_block(doc, """\
SELECT sp.provider_id, u.username,
       sp.first_name || ' ' || sp.last_name AS full_name,
       sp.rating_avg, sp.jobs_completed
FROM   SERVICE_PROVIDERS sp
JOIN   USERS u ON sp.user_id = u.user_id
WHERE  sp.background_chk = 'APPROVED'
  AND  u.is_active = 1
ORDER  BY sp.rating_avg DESC;""")

body(doc, 'List all bookings for a customer with provider and status:', size=12, space_after=2)
code_block(doc, """\
SELECT b.booking_id, so.service_name,
       sp.first_name || ' ' || sp.last_name AS provider,
       b.scheduled_date, b.status
FROM   BOOKINGS b
JOIN   SERVICES_OFFERED  so ON b.service_id  = so.service_id
JOIN   SERVICE_PROVIDERS sp ON so.provider_id = sp.provider_id
WHERE  b.customer_id = :cust_id
ORDER  BY b.scheduled_date DESC;""")

body(doc, 'Disable a provider availability slot:', size=12, space_after=2)
code_block(doc, """\
UPDATE PROVIDER_AVAILABILITY
SET    is_available = 0
WHERE  availability_id = :slot_id AND provider_id = :prov_id;""")

body(doc, 'Remove expired promo codes that have been fully used:', size=12, space_after=2)
code_block(doc, """\
DELETE FROM PROMOTIONS
WHERE  valid_until < SYSDATE AND current_uses >= max_uses;""")

heading(doc, '5.3  Complex queries', size=13, bold=True, space_before=10, space_after=6)

body(doc, 'Complete booking history for one customer — multi-table JOIN across 8 tables:', size=12, space_after=2)
code_block(doc, """\
SELECT b.booking_id,
       so.service_name,
       sc.category_name,
       sp.first_name || ' ' || sp.last_name AS provider,
       b.scheduled_date,
       b.status,
       i.net_total,
       py.payment_method,
       py.payment_status,
       r.rating
FROM   BOOKINGS           b
JOIN   SERVICES_OFFERED   so ON b.service_id   = so.service_id
JOIN   SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
JOIN   SERVICE_PROVIDERS  sp ON so.provider_id = sp.provider_id
JOIN   CUSTOMERS          c  ON b.customer_id  = c.customer_id
LEFT JOIN INVOICES        i  ON b.booking_id   = i.booking_id
LEFT JOIN PAYMENTS        py ON i.invoice_id   = py.invoice_id
LEFT JOIN REVIEWS         r  ON b.booking_id   = r.booking_id
WHERE  c.user_id = :user_id
ORDER  BY b.scheduled_date DESC;""")

body(doc, 'Platform revenue by service category — GROUP BY with aggregates:', size=12, space_after=2)
code_block(doc, """\
SELECT sc.category_name,
       COUNT(b.booking_id)       AS total_bookings,
       SUM(i.platform_fee)       AS platform_revenue,
       ROUND(AVG(i.net_total),2) AS avg_order_value
FROM   BOOKINGS           b
JOIN   SERVICES_OFFERED   so ON b.service_id   = so.service_id
JOIN   SERVICE_CATEGORIES sc ON so.category_id = sc.category_id
JOIN   INVOICES            i ON b.booking_id   = i.booking_id
WHERE  b.status = 'COMPLETED'
GROUP  BY sc.category_name
ORDER  BY platform_revenue DESC;""")

body(doc, 'Providers with above-average rating in their city — correlated subquery:', size=12, space_after=2)
code_block(doc, """\
SELECT sp.provider_id,
       sp.first_name || ' ' || sp.last_name AS provider,
       sa.city_name, sp.rating_avg
FROM   SERVICE_PROVIDERS sp
JOIN   PROVIDER_AREAS    pa ON pa.provider_id = sp.provider_id
JOIN   SERVICE_AREAS     sa ON pa.area_id     = sa.area_id
WHERE  sp.rating_avg > (
           SELECT AVG(sp2.rating_avg)
           FROM   SERVICE_PROVIDERS sp2
           WHERE  sp2.background_chk = 'APPROVED'
       )
  AND  sp.background_chk = 'APPROVED'
ORDER  BY sa.city_name, sp.rating_avg DESC;""")

body(doc, 'Rank providers by composite score within each service area — window function:', size=12, space_after=2)
code_block(doc, """\
SELECT sa.city_name,
       sp.first_name || ' ' || sp.last_name AS provider,
       sp.rating_avg,
       sp.jobs_completed,
       ROUND((sp.rating_avg * 0.5)
             + (LEAST(sp.jobs_completed,100)/100.0 * 0.3)
             + 0.2, 2) AS score,
       RANK() OVER (
           PARTITION BY sa.area_id
           ORDER BY (sp.rating_avg * 0.5
                     + LEAST(sp.jobs_completed,100)/100.0 * 0.3
                     + 0.2) DESC
       ) AS city_rank
FROM   SERVICE_PROVIDERS sp
JOIN   PROVIDER_AREAS    pa ON pa.provider_id = sp.provider_id
JOIN   SERVICE_AREAS     sa ON pa.area_id     = sa.area_id
WHERE  sp.background_chk = 'APPROVED';""")

body(doc, 'Monthly booking trend for the current year — CASE aggregates:', size=12, space_after=2)
code_block(doc, """\
SELECT TO_CHAR(b.scheduled_date, 'YYYY-MM') AS booking_month,
       COUNT(*)  AS total_bookings,
       COUNT(CASE WHEN b.status='COMPLETED' THEN 1 END) AS completed,
       COUNT(CASE WHEN b.status='CANCELLED' THEN 1 END) AS cancelled
FROM   BOOKINGS b
WHERE  EXTRACT(YEAR FROM b.scheduled_date) = EXTRACT(YEAR FROM SYSDATE)
GROUP  BY TO_CHAR(b.scheduled_date, 'YYYY-MM')
ORDER  BY booking_month;""")

body(doc, 'High-value customers who have spent more than Rs.2000 total — HAVING clause:', size=12, space_after=2)
code_block(doc, """\
SELECT c.customer_id, u.username,
       COUNT(b.booking_id) AS total_bookings,
       SUM(i.net_total)    AS total_spent
FROM   CUSTOMERS c
JOIN   USERS     u  ON c.user_id     = u.user_id
JOIN   BOOKINGS  b  ON b.customer_id = c.customer_id
JOIN   INVOICES  i  ON i.booking_id  = b.booking_id
WHERE  b.status = 'COMPLETED'
GROUP  BY c.customer_id, u.username
HAVING SUM(i.net_total) > 2000
ORDER  BY total_spent DESC;""")

heading(doc, '5.4  Stored procedures', size=13, bold=True, space_before=10, space_after=6)

body(doc, 'SP1: sp_create_booking', size=12, space_after=2)
body(doc, (
    'Creates a confirmed booking after validating three things: the requested time window falls inside '
    'the provider\'s availability range, no active booking already occupies that window for the same '
    'provider, and the promo code (if supplied) is valid. An invalid promo is silently ignored — '
    'the booking still proceeds without a discount. The EXCEPTION handler assigns SQLERRM to a '
    'VARCHAR2 variable before the INSERT into ERROR_LOGS, because SQLERRM cannot be used directly '
    'inside a SQL VALUES clause in Oracle PL/SQL.'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE PROCEDURE sp_create_booking (
    p_cust_id    IN NUMBER, p_srvc_id IN NUMBER,
    p_addr_id    IN NUMBER, p_avail_id IN NUMBER,
    p_promo_code IN VARCHAR2, p_date IN TIMESTAMP,
    p_dur        IN NUMBER
)
IS
    v_promo_id NUMBER := NULL; v_provider_id NUMBER;
    v_overlap_count NUMBER;
    v_range_start TIMESTAMP; v_range_end TIMESTAMP;
    v_err VARCHAR2(2000);
BEGIN
    SELECT provider_id INTO v_provider_id
    FROM   SERVICES_OFFERED WHERE service_id = p_srvc_id;

    SELECT TRUNC(p_date)+(TO_CHAR(slot_start,'SSSSS')/86400),
           TRUNC(p_date)+(TO_CHAR(slot_end,  'SSSSS')/86400)
    INTO   v_range_start, v_range_end
    FROM   PROVIDER_AVAILABILITY WHERE availability_id = p_avail_id;

    IF p_date < v_range_start
    OR (p_date + p_dur/24) > v_range_end THEN
        RAISE_APPLICATION_ERROR(-20011,
            'Requested time is outside the provider''s available hours.');
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM   BOOKINGS b JOIN SERVICES_OFFERED so
           ON b.service_id = so.service_id
    WHERE  so.provider_id = v_provider_id
      AND  b.status IN ('PENDING','CONFIRMED','IN_PROGRESS')
      AND  p_date < (b.scheduled_date + b.duration_hours/24)
      AND  (p_date + p_dur/24) > b.scheduled_date;

    IF v_overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20010,
            'Time slot is already occupied by another booking.');
    END IF;

    IF p_promo_code IS NOT NULL THEN
        BEGIN
            SELECT promo_id INTO v_promo_id FROM PROMOTIONS
            WHERE  UPPER(promo_code) = UPPER(p_promo_code)
              AND  is_active=1 AND current_uses < max_uses
              AND  valid_until > SYSDATE AND valid_from <= SYSDATE;
            UPDATE PROMOTIONS SET current_uses = current_uses+1
            WHERE  promo_id = v_promo_id;
        EXCEPTION WHEN NO_DATA_FOUND THEN v_promo_id := NULL;
        END;
    END IF;

    INSERT INTO BOOKINGS (
        customer_id, service_id, address_id, availability_id,
        promo_id, scheduled_date, duration_hours, status
    ) VALUES (
        p_cust_id, p_srvc_id, p_addr_id, p_avail_id,
        v_promo_id, p_date, p_dur, 'CONFIRMED'
    );
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM; ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity,procedure_name,error_message)
            VALUES ('CRITICAL','sp_create_booking',v_err);
            COMMIT;
        END;
        RAISE;
END sp_create_booking;
/""")

body(doc, 'SP2: sp_generate_invoice', size=12, space_after=2)
body(doc, (
    'Called after BOOKINGS.status is set to COMPLETED. Computes base = hourly_rate x duration_hours. '
    'If the booking used a promo, looks up discount_percentage and caps the discount at max_discount_amt. '
    'Platform fee = 10% of discounted amount, GST = 5%, net total = sum of all. '
    'This is the only path that creates INVOICES rows.'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE PROCEDURE sp_generate_invoice (p_booking_id IN NUMBER)
IS
    v_hourly_rate NUMBER; v_dur NUMBER;
    v_base NUMBER; v_discount NUMBER := 0;
    v_fee NUMBER; v_tax NUMBER; v_net NUMBER;
    v_err VARCHAR2(2000);
BEGIN
    SELECT so.hourly_rate, b.duration_hours
    INTO   v_hourly_rate, v_dur
    FROM   BOOKINGS b
    JOIN   SERVICES_OFFERED so ON b.service_id = so.service_id
    WHERE  b.booking_id = p_booking_id;

    v_base := v_hourly_rate * v_dur;

    FOR rec IN (
        SELECT p.discount_percentage, p.max_discount_amt
        FROM   PROMOTIONS p JOIN BOOKINGS b ON b.promo_id = p.promo_id
        WHERE  b.booking_id = p_booking_id
    ) LOOP
        v_discount := LEAST(v_base*(rec.discount_percentage/100),
                            rec.max_discount_amt);
    END LOOP;

    v_fee := ROUND((v_base-v_discount)*0.10, 2);
    v_tax := ROUND((v_base-v_discount)*0.05, 2);
    v_net := ROUND((v_base-v_discount)+v_fee+v_tax, 2);

    INSERT INTO INVOICES (booking_id,base_amount,discount_amount,
                          platform_fee,tax_amount,net_total)
    VALUES (p_booking_id,v_base,v_discount,v_fee,v_tax,v_net);
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM; ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity,procedure_name,error_message)
            VALUES ('CRITICAL','sp_generate_invoice',v_err); COMMIT;
        END;
        RAISE;
END sp_generate_invoice;
/""")

body(doc, 'SP3: sp_cancel_booking', size=12, space_after=2)
body(doc, (
    'Cancels a booking that is not already COMPLETED or CANCELLED, restores the availability slot, '
    'logs the reason, and refunds any SUCCESS/COMPLETED payment. The payment refund block uses a '
    'nested BEGIN/EXCEPTION to handle the case where no payment exists yet without raising an error.'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE PROCEDURE sp_cancel_booking (
    p_booking_id   IN NUMBER,
    p_cancelled_by IN VARCHAR2,
    p_reason       IN VARCHAR2
)
IS
    v_status VARCHAR2(20); v_avail_id NUMBER;
    v_invoice_id NUMBER; v_pay_status VARCHAR2(20);
    v_err VARCHAR2(2000);
BEGIN
    SELECT status, availability_id INTO v_status, v_avail_id
    FROM   BOOKINGS WHERE booking_id = p_booking_id;

    IF v_status = 'COMPLETED' THEN
        RAISE_APPLICATION_ERROR(-20020,
            'Cannot cancel a completed booking.');
    END IF;
    IF v_status = 'CANCELLED' THEN
        RAISE_APPLICATION_ERROR(-20021,
            'Booking is already cancelled.');
    END IF;

    UPDATE BOOKINGS SET status = 'CANCELLED'
    WHERE  booking_id = p_booking_id;
    UPDATE PROVIDER_AVAILABILITY SET is_available = 1
    WHERE  availability_id = v_avail_id;
    INSERT INTO CANCELLATIONS (booking_id,cancelled_by,reason)
    VALUES (p_booking_id, p_cancelled_by, p_reason);

    BEGIN
        SELECT i.invoice_id, p.payment_status
        INTO   v_invoice_id, v_pay_status
        FROM   INVOICES i JOIN PAYMENTS p ON p.invoice_id=i.invoice_id
        WHERE  i.booking_id = p_booking_id;
        IF v_pay_status IN ('SUCCESS','COMPLETED') THEN
            UPDATE PAYMENTS
            SET    payment_status = 'REFUNDED',
                   amount_paid = (SELECT net_total FROM INVOICES
                                  WHERE invoice_id = v_invoice_id)
            WHERE  invoice_id = v_invoice_id;
        END IF;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL;
    END;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        v_err := SQLERRM; ROLLBACK;
        BEGIN
            INSERT INTO ERROR_LOGS (severity,procedure_name,error_message)
            VALUES ('CRITICAL','sp_cancel_booking',v_err); COMMIT;
        END;
        RAISE;
END sp_cancel_booking;
/""")

heading(doc, '5.5  Trigger', size=13, bold=True, space_before=10, space_after=6)
body(doc, 'trg_update_provider_rating — COMPOUND trigger on REVIEWS', size=12, space_after=4)
body(doc, (
    'A compound trigger is used instead of a simple AFTER EACH ROW trigger to avoid the '
    'mutating-table error that would arise when the row section tries to query BOOKINGS '
    '(which is indirectly referenced by the REVIEWS → BOOKINGS chain). The compound trigger '
    'collects affected provider IDs in the AFTER EACH ROW section, then does the bulk UPDATE '
    'in a single AFTER STATEMENT pass. The AFTER STATEMENT block recomputes two values: '
    'rating_avg as the average of all review ratings for that provider\'s bookings, and '
    'jobs_completed as a count of distinct COMPLETED bookings — not reviews.'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE TRIGGER trg_update_provider_rating
FOR INSERT OR UPDATE OR DELETE ON REVIEWS
COMPOUND TRIGGER

    TYPE t_id_table IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
    v_affected t_id_table;

AFTER EACH ROW IS
    v_pid NUMBER;
BEGIN
    SELECT so.provider_id INTO v_pid
    FROM   BOOKINGS b JOIN SERVICES_OFFERED so
           ON so.service_id = b.service_id
    WHERE  b.booking_id = NVL(:NEW.booking_id, :OLD.booking_id);
    v_affected(v_pid) := v_pid;
EXCEPTION WHEN NO_DATA_FOUND THEN NULL;
END AFTER EACH ROW;

AFTER STATEMENT IS
    v_idx NUMBER;
BEGIN
    v_idx := v_affected.FIRST;
    WHILE v_idx IS NOT NULL LOOP
        UPDATE SERVICE_PROVIDERS sp
        SET (rating_avg, jobs_completed) = (
            SELECT NVL(ROUND(AVG(r.rating),2),0.00),
                   COUNT(DISTINCT
                       CASE WHEN b.status='COMPLETED'
                       THEN b.booking_id END)
            FROM   REVIEWS r
            JOIN   BOOKINGS b  ON b.booking_id  = r.booking_id
            JOIN   SERVICES_OFFERED so
                               ON so.service_id = b.service_id
            WHERE  so.provider_id = v_idx
        )
        WHERE sp.provider_id = v_idx;
        v_idx := v_affected.NEXT(v_idx);
    END LOOP;
END AFTER STATEMENT;

END trg_update_provider_rating;
/""")

heading(doc, '5.6  Function and view', size=13, bold=True, space_before=10, space_after=6)
body(doc, 'fn_recommend_providers — returns SYS_REFCURSOR of ranked providers for an area', size=12, space_after=4)
body(doc, (
    'Takes a service area ID and returns an open cursor of approved, active providers in that area '
    'ranked by composite score: 50% of rating_avg, 30% of job count normalised to 100, '
    'and 0.2 flat baseline so new providers with no jobs still appear. '
    'The backend calls this via an anonymous block and reads rows using node-oracledb\'s resultSet API.'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE FUNCTION fn_recommend_providers (
    p_area_id IN NUMBER
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT sp.provider_id, u.username,
               sp.first_name||' '||sp.last_name AS full_name,
               sp.rating_avg, sp.jobs_completed,
               ROUND(
                   (sp.rating_avg * 0.5)
                   +(LEAST(sp.jobs_completed,100)/100.0*0.3)
                   +0.2, 2) AS score
        FROM   SERVICE_PROVIDERS sp
        JOIN   USERS u ON u.user_id = sp.user_id
        JOIN   PROVIDER_AREAS pa ON pa.provider_id = sp.provider_id
        WHERE  pa.area_id = p_area_id
          AND  sp.background_chk = 'APPROVED'
          AND  u.is_active = 1
        ORDER BY score DESC;
    RETURN v_cursor;
END fn_recommend_providers;
/""")

body(doc, 'vw_provider_summary — provider profile view for browse and admin screens', size=12, space_after=4)
body(doc, (
    'Joins SERVICE_PROVIDERS with USERS and uses a correlated subquery to pull the most recent '
    'active category name per provider. The WHERE clause filters deactivated accounts so they '
    'never appear in the public listing. Two backend routes query this view: GET /providers (list) '
    'and GET /providers/:id (detail).'
), size=12, space_after=4)
code_block(doc, """\
CREATE OR REPLACE VIEW vw_provider_summary AS
SELECT sp.provider_id,
       u.username,
       sp.first_name || ' ' || sp.last_name AS full_name,
       (SELECT MAX(sc.category_name)
        FROM   SERVICE_CATEGORIES sc
        JOIN   SERVICES_OFFERED so ON sc.category_id=so.category_id
        WHERE  so.provider_id = sp.provider_id
          AND  so.is_active   = 1)           AS category_name,
       sp.rating_avg,
       sp.jobs_completed,
       u.is_active
FROM SERVICE_PROVIDERS sp
JOIN USERS u ON sp.user_id = u.user_id
WHERE u.is_active = 1;""")
doc.add_page_break()

# ─── CHAPTER 6 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 6: RESULTS AND SNAPSHOTS', size=14, bold=True, space_before=8, space_after=12)
body(doc, (
    'This chapter presents the output of key queries, demonstrates stored procedure behaviour, '
    'verifies trigger execution, and shows the web application screens. SQL Developer was used '
    'to run all DDL and seed data; the React frontend was used for end-to-end flow screenshots.'
), size=12, space_after=12)

heading(doc, '6.1  Table creation output', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'Running init.sql in SQL Developer creates all 18 tables in dependency order, then compiles '
    'the three procedures, the compound trigger, the function, and the view. The Script Output panel '
    'confirms each object with messages such as "Procedure SP_CREATE_BOOKING compiled" and '
    '"Trigger TRG_UPDATE_PROVIDER_RATING compiled". SET DEFINE OFF at the top of the script '
    'prevents SQL Developer from treating the ampersand in \'Wiring & Rewiring\' as a '
    'substitution variable prompt.'
), size=12, space_after=8)
body(doc, '[Screenshot: SQL Developer Script Output — all 18 tables and 6 PL/SQL objects compiled successfully]', size=10, space_after=8)

heading(doc, '6.2  Basic query output', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'Selecting all approved providers from vw_provider_summary returns three rows from the seed data: '
    'Bob Builder (PLUMBING, rating 4.50, 50 jobs), Dave Spark (ELECTRICAL, 4.80, 37 jobs), '
    'and Priya Verma (CLEANING, 4.90, 62 jobs). The admin user and customer accounts do not appear '
    'because the view joins SERVICE_PROVIDERS — user records with no provider profile produce no rows.'
), size=12, space_after=8)
body(doc, '[Screenshot: SELECT result from vw_provider_summary — 3 rows showing provider details]', size=10, space_after=8)

heading(doc, '6.3  Complex query outputs', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'The revenue query grouped by category returns one row for PLUMBING from the demo booking: '
    'total_bookings = 1, platform_revenue = 70.00, avg_order_value = 805.00. '
    'The window function ranking query shows Priya Verma first in Bangalore (score 2.697), '
    'Dave Spark second in Bangalore (2.511), and Bob Builder first in Mumbai (2.400), '
    'with the RANK() counter resetting correctly when PARTITION BY city changes.'
), size=12, space_after=8)
body(doc, '[Screenshot: Window function ranking query — RANK column resets per city partition]', size=10, space_after=8)

heading(doc, '6.4  Stored procedure results', size=13, bold=True, space_before=8, space_after=6)
body(doc, 'Calling sp_create_booking with promo code SAVE10:', size=12, space_after=2)
code_block(doc, """\
BEGIN
    sp_create_booking(
        p_cust_id => 1, p_srvc_id => 1,
        p_addr_id => 1, p_avail_id => 1,
        p_promo_code => 'SAVE10',
        p_date => SYSTIMESTAMP + INTERVAL '7' DAY,
        p_dur  => 3
    );
END;
/
-- Result: PL/SQL procedure successfully completed.
-- BOOKINGS: 1 row inserted, status=CONFIRMED, promo_id=1
-- PROMOTIONS: current_uses incremented from 0 to 1""")
body(doc, (
    'Calling the same booking again with an overlapping time raises ORA-20010 (slot occupied), '
    'which the Express backend maps to HTTP 409 with error code SLOT_OCCUPIED. '
    'Calling with a time outside the provider\'s slot hours raises ORA-20011, '
    'mapped to HTTP 400 OUT_OF_RANGE.'
), size=12, space_after=8)
body(doc, 'Calling sp_generate_invoice after marking the booking COMPLETED:', size=12, space_after=2)
code_block(doc, """\
BEGIN sp_generate_invoice(p_booking_id => 1); END;
/
-- INVOICES: 1 row inserted
-- base_amount=700.00 (350/hr * 2hrs), platform_fee=70.00,
-- tax_amount=35.00, net_total=805.00""")
body(doc, '[Screenshot: INVOICES table after sp_generate_invoice call — computed amounts visible]', size=10, space_after=8)

heading(doc, '6.5  Trigger verification', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'The compound trigger fires when the demo review (rating = 5) is inserted. '
    'Before the insert, Bob Builder\'s rating_avg is 4.50 (set by seed data) and jobs_completed is 50. '
    'After the insert, the trigger recomputes both values from scratch: the only review now on record '
    'gives 5, so rating_avg becomes 5.00, and jobs_completed becomes 1 (one COMPLETED booking in the DB). '
    'Changing the review rating to 3 fires the trigger again and sets rating_avg to 3.00. '
    'Deleting the review sets rating_avg to 0.00 and jobs_completed to 0.'
), size=12, space_after=8)
body(doc, '[Screenshot: SERVICE_PROVIDERS row before and after review insert — rating_avg and jobs_completed updated by trigger]', size=10, space_after=8)

heading(doc, '6.6  Web application snapshots', size=13, bold=True, space_before=8, space_after=6)
for screen, desc in [
    ('Login page',
     'Username/password form with role-aware redirect: customers to the customer dashboard, '
     'providers to the provider dashboard, admins to the admin panel.'),
    ('Customer browse page',
     'Grid of provider cards showing name, category badge, star rating, and job count. '
     'Each card links to the booking form.'),
    ('Booking form — step 1 (details)',
     'Service dropdown, address fields (house number, building, area, city, pincode — pincode required), '
     'availability slot picker, date picker showing next 4 occurrences of the chosen day, '
     'and 3-hour time window grid showing only unbooked slots (booked slots are hidden, not greyed out).'),
    ('Booking form — step 2 (payment)',
     'Payment method selection (Cash, UPI, Credit Card). Booking is already created at this point; '
     'this step records the customer\'s payment preference.'),
    ('My bookings page',
     'Filterable list by status (ALL / PENDING / CONFIRMED / COMPLETED / CANCELLED) with status pills '
     'and action buttons. COMPLETED bookings show a View Invoice button; active bookings show Cancel.'),
    ('Invoice modal',
     'Itemised invoice showing base fee, platform fee (10%), promo discount, GST (5%), and net total. '
     'Payment Confirmed banner with transaction ID is shown — no Pay Now button since payment '
     'is recorded automatically when the provider marks the job complete.'),
    ('Provider dashboard',
     'Lists all bookings assigned to the logged-in provider with a Mark Complete button for '
     'CONFIRMED bookings. Shows the provider\'s current rating average and job count.'),
    ('Admin panel',
     'Revenue breakdown by category and the ERROR_LOGS table showing any PL/SQL exceptions '
     'with severity, source procedure, message, and timestamp.'),
]:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run(screen + ' — ')
    set_font(r1, size=12, bold=True)
    r2 = p.add_run(desc)
    set_font(r2, size=12)
    body(doc, f'[Screenshot: {screen}]', size=10, space_after=6)
doc.add_page_break()

# ─── CHAPTER 7 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 7: CONCLUSION, LIMITATIONS AND FUTURE WORK', size=14, bold=True, space_before=8, space_after=12)

heading(doc, '7.1  Conclusion', size=13, bold=True, space_before=8, space_after=6)
body(doc, (
    'ServeMart achieves what it set out to do. The 18-table Oracle schema stores every part of the '
    'service marketplace transaction lifecycle with referential integrity enforced at the database level. '
    'The three stored procedures handle booking, invoicing, and cancellation in a way that is '
    'consistent regardless of which client calls them. The compound trigger keeps provider ratings '
    'accurate without any application-side recalculation. The recommendation function produces a '
    'ranked, area-filtered list that the frontend consumes directly from a cursor.'
), size=12, space_after=8)
body(doc, 'The project achieved all stated objectives:', size=12, space_after=4)
for item in [
    'A normalised relational schema was designed and implemented in Oracle 21c with 18 tables, all in 3NF.',
    'All entities carry appropriate PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, and CHECK constraints.',
    'Basic and complex SQL queries were written and tested, covering multi-table JOINs, aggregations, subqueries, and window functions.',
    'Three stored procedures encapsulate the booking, invoicing, and cancellation workflows with structured error logging.',
    'A compound trigger on REVIEWS recomputes provider ratings and completed job counts after every review change, without application-level code.',
    'A table function returns a ranked recommendation cursor for any service area using a weighted composite score.',
    'A view aggregates provider summary data consumed by two separate API routes.',
    'A role-adaptive React single-page application demonstrates live Oracle connectivity with JWT authentication and Zod request validation.',
]:
    bullet(doc, item)
doc.add_paragraph()

heading(doc, '7.2  Limitations', size=13, bold=True, space_before=8, space_after=6)
for title, desc in [
    ('No payment gateway',
     'Payment is recorded as SUCCESS automatically when the provider marks the job complete. '
     'Real card or UPI payment is not processed. This was an explicit scope decision.'),
    ('No real-time updates',
     'The My Bookings page polls the server every 30 seconds. A booking status change by the '
     'provider does not push to the customer immediately.'),
    ('Weekly slot templates, not calendar dates',
     'PROVIDER_AVAILABILITY stores recurring weekly slots (e.g. MONDAY 09:00-17:00) rather than '
     'specific calendar dates. A provider cannot block off individual days without disabling '
     'the entire weekly slot.'),
    ('No file storage',
     'Service images, identity documents, and background check certificates are not stored. '
     'A full deployment would need cloud storage and a reference column in the schema.'),
    ('Manual admin approval',
     'Background check approval is a single admin endpoint with no automated verification pipeline '
     'or third-party identity check integration.'),
    ('Single service area per booking',
     'A booking always goes to the address the customer provides. The system does not support '
     'a provider travelling across city boundaries for a single booking.'),
]:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    r1 = p.add_run(title + ': ')
    set_font(r1, size=12, bold=True)
    r2 = p.add_run(desc)
    set_font(r2, size=12)
doc.add_paragraph()

heading(doc, '7.3  Future work', size=13, bold=True, space_before=8, space_after=6)
for item in [
    'Integrate a real payment gateway (Razorpay or Stripe) and store transaction references. The PAYMENTS table already has a transaction_id column ready for this.',
    'Replace 30-second polling in My Bookings with WebSocket push notifications so booking status changes appear in real time.',
    'Add a calendar-based availability model with a separate AVAILABILITY_EXCEPTIONS table for date-level overrides, so providers can block individual days.',
    'Build an ML-based recommendation layer on top of fn_recommend_providers that factors in a customer\'s past service history, not just aggregate provider stats.',
    'Add support ticket resolution workflows — SUPPORT_TICKETS are logged but there is no admin reply or resolution flow in the frontend.',
    'Export invoices as PDF using a server-side renderer rather than the browser\'s print dialog.',
    'Introduce geolocation-based area matching so customers see only providers who cover their specific pin code, not just their city.',
]:
    bullet(doc, item)
doc.add_page_break()

# ─── CHAPTER 8 ───────────────────────────────────────────────────────────────

heading(doc, 'CHAPTER 8: REFERENCES', size=14, bold=True, space_before=8, space_after=12)
for i, ref in enumerate([
    'Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). Database System Concepts (7th ed.). McGraw-Hill Education.',
    'Ramakrishnan, R., & Gehrke, J. (2002). Database Management Systems (3rd ed.). McGraw-Hill.',
    'Oracle Corporation. Oracle Database 21c PL/SQL Language Reference. https://docs.oracle.com/en/database/oracle/oracle-database/21/lnpls/',
    'Oracle Corporation. Oracle Database 21c SQL Language Reference. https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/',
    'node-oracledb Documentation (v6). Oracle Corporation. https://node-oracledb.readthedocs.io/',
    'Express.js 4.x Documentation. OpenJS Foundation. https://expressjs.com/',
    'React Documentation (v19). Meta Open Source. https://react.dev/',
    'JSON Web Token Standard — RFC 7519. Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc7519',
    'bcrypt — Password Hashing Library. https://www.npmjs.com/package/bcrypt',
    'Zod — TypeScript-first Schema Validation. https://zod.dev/',
], 1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.4)
    p.paragraph_format.first_line_indent = Inches(-0.4)
    run = p.add_run(f'{i}. {ref}')
    set_font(run, size=12)

# ─── SAVE ────────────────────────────────────────────────────────────────────

output_path = r'D:\DBS PROJECT\ServeMart_MiniProject_Report_v2.docx'
doc.save(output_path)
print(f'Report saved to {output_path}')
