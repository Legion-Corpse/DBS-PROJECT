from graphviz import Digraph

g = Digraph('ServeMart_ER', format='png')
g.attr(
    rankdir='TB',
    splines='polyline',
    bgcolor='white',
    fontname='Helvetica',
    dpi='200',
    nodesep='0.6',
    ranksep='0.8',
    size='24,32',
    ratio='fill'
)

# ── Styles ──────────────────────────────────────────────────────────────────
entity_style = {
    'shape': 'rectangle',
    'style': 'filled',
    'fillcolor': '#D6E8FF',
    'color': '#2255AA',
    'penwidth': '1.5',
    'fontsize': '12',
    'fontname': 'Helvetica-Bold'
}
weak_entity_style = {
    'shape': 'rectangle',
    'peripheries': '2',
    'style': 'filled',
    'fillcolor': '#D6E8FF',
    'color': '#2255AA',
    'penwidth': '1.5',
    'fontsize': '12',
    'fontname': 'Helvetica-Bold'
}
rel_style = {
    'shape': 'diamond',
    'style': 'filled',
    'fillcolor': '#FFF4AA',
    'color': '#886600',
    'penwidth': '1.5',
    'fontsize': '10',
    'fontname': 'Helvetica'
}
id_rel_style = {                          # double-diamond for identifying rel
    'shape': 'diamond',
    'peripheries': '2',
    'style': 'filled',
    'fillcolor': '#FFE0A0',
    'color': '#886600',
    'penwidth': '1.5',
    'fontsize': '10',
    'fontname': 'Helvetica'
}
isa_style = {
    'shape': 'triangle',
    'style': 'filled',
    'fillcolor': '#E8FFD6',
    'color': '#226622',
    'penwidth': '1.5',
    'fontsize': '10',
    'fontname': 'Helvetica'
}
attr_style = {
    'shape': 'ellipse',
    'style': 'filled',
    'fillcolor': '#F5F5F5',
    'color': '#555555',
    'fontsize': '9',
    'fontname': 'Helvetica'
}
pk_attr_style = {                         # primary key — underline via HTML
    'shape': 'ellipse',
    'style': 'filled',
    'fillcolor': '#F5F5F5',
    'color': '#555555',
    'fontsize': '9',
    'fontname': 'Helvetica'
}
disc_attr_style = {                       # discriminator (weak entity partial key)
    'shape': 'ellipse',
    'style': 'dashed,filled',
    'fillcolor': '#F5F5F5',
    'color': '#555555',
    'fontsize': '9',
    'fontname': 'Helvetica'
}

# ── Helper to add a PK attribute (underlined label via HTML) ────────────────
def pk_attr(graph, node_id, label, entity):
    graph.node(node_id, label=f'<<u>{label}</u>>', **pk_attr_style)
    graph.edge(entity, node_id, arrowhead='none', arrowtail='none')

def attr_node(graph, node_id, label, entity, style=None):
    s = style if style else attr_style
    graph.node(node_id, label=label, **s)
    graph.edge(entity, node_id, arrowhead='none', arrowtail='none')

# ── Entities ─────────────────────────────────────────────────────────────────
strong_entities = [
    "USERS", "CUSTOMERS", "SERVICE_PROVIDERS", "SERVICE_AREAS",
    "PROVIDER_AREAS", "SERVICE_CATEGORIES", "SERVICES_OFFERED",
    "PROVIDER_AVAILABILITY", "PROMOTIONS", "BOOKINGS",
    "INVOICES", "PAYMENTS", "REVIEWS", "CANCELLATIONS", "ERROR_LOGS"
]
for e in strong_entities:
    g.node(e, **entity_style)

g.node("CUSTOMER_ADDRESSES", **weak_entity_style)

# ── ISA triangle (USERS → CUSTOMERS / SERVICE_PROVIDERS) ─────────────────────
g.node("ISA_USER", label="ISA", **isa_style)
# Single line from USERS to ISA (partial on USERS side)
g.edge("USERS", "ISA_USER", arrowhead='none')
# Double line = total participation on specialisation side
g.edge("ISA_USER", "CUSTOMERS",         arrowhead='none', penwidth='2.5', style='bold')
g.edge("ISA_USER", "SERVICE_PROVIDERS", arrowhead='none', penwidth='2.5', style='bold')

# ── Relationships ─────────────────────────────────────────────────────────────
# Format: (rel_node_id, label, entityA, partA_total, entityB, partB_total, identifying)
# partX_total=True  → double line (total participation)
# partX_total=False → single line (partial participation)
rels = [
    # rel_id              label              A                     A_tot  B                     B_tot  identifying
    ("HAS_ADDRESS",       "HAS_ADDRESS",     "CUSTOMERS",          False, "CUSTOMER_ADDRESSES", True,  True ),
    ("COVERS_PROVIDER",   "COVERS_AREA",     "SERVICE_PROVIDERS",  False, "PROVIDER_AREAS",     True,  False),
    ("COVERS_AREA",       "COVERS_AREA ",    "SERVICE_AREAS",      False, "PROVIDER_AREAS",     True,  False),
    ("OFFERS",            "OFFERS",          "SERVICE_PROVIDERS",  False, "SERVICES_OFFERED",   True,  False),
    ("BELONGS_TO",        "BELONGS_TO",      "SERVICES_OFFERED",   True,  "SERVICE_CATEGORIES", False, False),
    ("HAS_AVAILABILITY",  "HAS_AVAILABILITY","SERVICE_PROVIDERS",  False, "PROVIDER_AVAILABILITY", True, False),
    ("PLACES",            "PLACES",          "CUSTOMERS",          False, "BOOKINGS",           True,  False),
    ("BOOKS_SERVICE",     "BOOKS_SERVICE",   "SERVICES_OFFERED",   False, "BOOKINGS",           True,  False),
    ("USES_SLOT",         "USES_SLOT",       "PROVIDER_AVAILABILITY", False, "BOOKINGS",        True,  False),
    ("DELIVERED_TO",      "DELIVERED_TO",    "CUSTOMER_ADDRESSES", False, "BOOKINGS",           True,  False),
    ("APPLIES_PROMO",     "APPLIES_PROMO",   "PROMOTIONS",         False, "BOOKINGS",           False, False),
    ("GENERATES",         "GENERATES",       "BOOKINGS",           False, "INVOICES",           True,  False),
    ("SETTLED_BY",        "SETTLED_BY",      "INVOICES",           False, "PAYMENTS",           True,  False),
    ("HAS_REVIEW",        "HAS_REVIEW",      "BOOKINGS",           False, "REVIEWS",            True,  False),
    ("HAS_CANCELLATION",  "HAS_CANCELLATION","BOOKINGS",           False, "CANCELLATIONS",      True,  False),
]

for (rid, rlabel, a, a_tot, b, b_tot, identifying) in rels:
    style = id_rel_style if identifying else rel_style
    g.node(rid, label=rlabel, **style)

    # Edge A → relationship
    ew_a = '2.5' if a_tot else '1.0'
    st_a = 'bold' if a_tot else 'solid'
    g.edge(a, rid, arrowhead='none', penwidth=ew_a, style=st_a)

    # Edge relationship → B
    ew_b = '2.5' if b_tot else '1.0'
    st_b = 'bold' if b_tot else 'solid'
    g.edge(rid, b, arrowhead='none', penwidth=ew_b, style=st_b)

# ── Cardinality labels (1 / N) on edges ──────────────────────────────────────
card = [
    # (A, rel,                  labelA, rel,                  B,                    labelB)
    ("CUSTOMERS",            "HAS_ADDRESS",       "1", "HAS_ADDRESS",       "CUSTOMER_ADDRESSES", "N"),
    ("SERVICE_PROVIDERS",    "COVERS_PROVIDER",   "1", "COVERS_PROVIDER",   "PROVIDER_AREAS",     "N"),
    ("SERVICE_AREAS",        "COVERS_AREA",       "1", "COVERS_AREA",       "PROVIDER_AREAS",     "N"),
    ("SERVICE_PROVIDERS",    "OFFERS",            "1", "OFFERS",            "SERVICES_OFFERED",   "N"),
    ("SERVICES_OFFERED",     "BELONGS_TO",        "N", "BELONGS_TO",        "SERVICE_CATEGORIES", "1"),
    ("SERVICE_PROVIDERS",    "HAS_AVAILABILITY",  "1", "HAS_AVAILABILITY",  "PROVIDER_AVAILABILITY","N"),
    ("CUSTOMERS",            "PLACES",            "1", "PLACES",            "BOOKINGS",           "N"),
    ("SERVICES_OFFERED",     "BOOKS_SERVICE",     "1", "BOOKS_SERVICE",     "BOOKINGS",           "N"),
    ("PROVIDER_AVAILABILITY","USES_SLOT",         "1", "USES_SLOT",         "BOOKINGS",           "N"),
    ("CUSTOMER_ADDRESSES",   "DELIVERED_TO",      "1", "DELIVERED_TO",      "BOOKINGS",           "N"),
    ("PROMOTIONS",           "APPLIES_PROMO",     "1", "APPLIES_PROMO",     "BOOKINGS",           "N"),
    ("BOOKINGS",             "GENERATES",         "1", "GENERATES",         "INVOICES",           "1"),
    ("INVOICES",             "SETTLED_BY",        "1", "SETTLED_BY",        "PAYMENTS",           "1"),
    ("BOOKINGS",             "HAS_REVIEW",        "1", "HAS_REVIEW",        "REVIEWS",            "1"),
    ("BOOKINGS",             "HAS_CANCELLATION",  "1", "HAS_CANCELLATION",  "CANCELLATIONS",      "1"),
]

for (a, rid_a, la, rid_b, b, lb) in card:
    g.edge(a,   rid_a, label=la, arrowhead='none', fontsize='10', fontcolor='#CC0000', fontname='Helvetica-Bold')
    g.edge(rid_b, b,   label=lb, arrowhead='none', fontsize='10', fontcolor='#CC0000', fontname='Helvetica-Bold')

# ── Attributes ────────────────────────────────────────────────────────────────
# USERS
pk_attr(g, 'a_u_id',       'user_id',       'USERS')
attr_node(g, 'a_u_uname',  'username',      'USERS')
attr_node(g, 'a_u_email',  'email',         'USERS')
attr_node(g, 'a_u_role',   'user_role',     'USERS')
attr_node(g, 'a_u_active', 'is_active',     'USERS')

# CUSTOMERS
pk_attr(g, 'a_c_id',      'customer_id',   'CUSTOMERS')
attr_node(g, 'a_c_fn',    'first_name',    'CUSTOMERS')
attr_node(g, 'a_c_ln',    'last_name',     'CUSTOMERS')
attr_node(g, 'a_c_ph',    'phone',         'CUSTOMERS')

# SERVICE_PROVIDERS
pk_attr(g, 'a_sp_id',     'provider_id',   'SERVICE_PROVIDERS')
attr_node(g, 'a_sp_fn',   'first_name',    'SERVICE_PROVIDERS')
attr_node(g, 'a_sp_ln',   'last_name',     'SERVICE_PROVIDERS')
attr_node(g, 'a_sp_bg',   'background_chk','SERVICE_PROVIDERS')
attr_node(g, 'a_sp_rat',  'rating_avg',    'SERVICE_PROVIDERS')
attr_node(g, 'a_sp_jobs', 'jobs_completed','SERVICE_PROVIDERS')
attr_node(g, 'a_sp_exp',  'experience_yrs','SERVICE_PROVIDERS')

# CUSTOMER_ADDRESSES — discriminator for address_id
attr_node(g, 'a_ca_id',   'address_id',    'CUSTOMER_ADDRESSES', style=disc_attr_style)
attr_node(g, 'a_ca_lbl',  'location_label','CUSTOMER_ADDRESSES')
attr_node(g, 'a_ca_hno',  'house_no',      'CUSTOMER_ADDRESSES')
attr_node(g, 'a_ca_city', 'city',          'CUSTOMER_ADDRESSES')
attr_node(g, 'a_ca_pin',  'postal_code',   'CUSTOMER_ADDRESSES')

# SERVICE_AREAS
pk_attr(g, 'a_sa_id',     'area_id',       'SERVICE_AREAS')
attr_node(g, 'a_sa_city', 'city_name',     'SERVICE_AREAS')
attr_node(g, 'a_sa_reg',  'region_code',   'SERVICE_AREAS')

# SERVICE_CATEGORIES
pk_attr(g, 'a_sc_id',     'category_id',   'SERVICE_CATEGORIES')
attr_node(g, 'a_sc_nm',   'category_name', 'SERVICE_CATEGORIES')

# SERVICES_OFFERED
pk_attr(g, 'a_so_id',     'service_id',    'SERVICES_OFFERED')
attr_node(g, 'a_so_nm',   'service_name',  'SERVICES_OFFERED')
attr_node(g, 'a_so_rate', 'hourly_rate',   'SERVICES_OFFERED')
attr_node(g, 'a_so_act',  'is_active',     'SERVICES_OFFERED')

# PROVIDER_AVAILABILITY
pk_attr(g, 'a_pa_id',     'availability_id',  'PROVIDER_AVAILABILITY')
attr_node(g, 'a_pa_day',  'day_of_week',       'PROVIDER_AVAILABILITY')
attr_node(g, 'a_pa_ss',   'slot_start',        'PROVIDER_AVAILABILITY')
attr_node(g, 'a_pa_se',   'slot_end',          'PROVIDER_AVAILABILITY')
attr_node(g, 'a_pa_av',   'is_available',      'PROVIDER_AVAILABILITY')

# PROMOTIONS
pk_attr(g, 'a_pr_id',     'promo_id',          'PROMOTIONS')
attr_node(g, 'a_pr_cd',   'promo_code',        'PROMOTIONS')
attr_node(g, 'a_pr_pct',  'discount_%',        'PROMOTIONS')
attr_node(g, 'a_pr_max',  'max_discount_amt',  'PROMOTIONS')
attr_node(g, 'a_pr_vu',   'valid_until',       'PROMOTIONS')
attr_node(g, 'a_pr_mu',   'max_uses',          'PROMOTIONS')
attr_node(g, 'a_pr_cu',   'current_uses',      'PROMOTIONS')

# BOOKINGS
pk_attr(g, 'a_b_id',      'booking_id',    'BOOKINGS')
attr_node(g, 'a_b_date',  'scheduled_date','BOOKINGS')
attr_node(g, 'a_b_dur',   'duration_hours','BOOKINGS')
attr_node(g, 'a_b_stat',  'status',        'BOOKINGS')

# INVOICES
pk_attr(g, 'a_i_id',      'invoice_id',    'INVOICES')
attr_node(g, 'a_i_base',  'base_amount',   'INVOICES')
attr_node(g, 'a_i_disc',  'discount_amt',  'INVOICES')
attr_node(g, 'a_i_fee',   'platform_fee',  'INVOICES')
attr_node(g, 'a_i_tax',   'tax_amount',    'INVOICES')
attr_node(g, 'a_i_net',   'net_total',     'INVOICES')

# PAYMENTS
pk_attr(g, 'a_py_id',     'payment_id',    'PAYMENTS')
attr_node(g, 'a_py_amt',  'amount_paid',   'PAYMENTS')
attr_node(g, 'a_py_mth',  'payment_method','PAYMENTS')
attr_node(g, 'a_py_sts',  'payment_status','PAYMENTS')
attr_node(g, 'a_py_txn',  'transaction_id','PAYMENTS')

# REVIEWS
pk_attr(g, 'a_r_id',      'review_id',     'REVIEWS')
attr_node(g, 'a_r_rat',   'rating',        'REVIEWS')
attr_node(g, 'a_r_cmt',   'comments',      'REVIEWS')

# CANCELLATIONS
pk_attr(g, 'a_cn_id',     'cancellation_id','CANCELLATIONS')
attr_node(g, 'a_cn_by',   'cancelled_by',   'CANCELLATIONS')
attr_node(g, 'a_cn_rsn',  'reason',         'CANCELLATIONS')

# ERROR_LOGS
pk_attr(g, 'a_el_id',     'log_id',        'ERROR_LOGS')
attr_node(g, 'a_el_sev',  'severity',      'ERROR_LOGS')
attr_node(g, 'a_el_proc', 'procedure_name','ERROR_LOGS')
attr_node(g, 'a_el_msg',  'error_message', 'ERROR_LOGS')

# ── Layout hints — rank groups ────────────────────────────────────────────────
with g.subgraph() as top:
    top.attr(rank='same')
    top.node('USERS')
    top.node('ISA_USER')

with g.subgraph() as lvl2:
    lvl2.attr(rank='same')
    lvl2.node('CUSTOMERS')
    lvl2.node('SERVICE_PROVIDERS')

with g.subgraph() as lvl3:
    lvl3.attr(rank='same')
    lvl3.node('BOOKINGS')
    lvl3.node('SERVICES_OFFERED')
    lvl3.node('PROVIDER_AVAILABILITY')
    lvl3.node('SERVICE_CATEGORIES')

with g.subgraph() as lvl4:
    lvl4.attr(rank='same')
    lvl4.node('INVOICES')
    lvl4.node('REVIEWS')
    lvl4.node('CANCELLATIONS')
    lvl4.node('PROMOTIONS')

with g.subgraph() as lvl5:
    lvl5.attr(rank='same')
    lvl5.node('PAYMENTS')
    lvl5.node('ERROR_LOGS')

# ── Render ────────────────────────────────────────────────────────────────────
out = r'D:\DBS PROJECT\servemart_er_diagram'
g.render(filename=out, cleanup=True)
print(f"Saved: {out}.png")