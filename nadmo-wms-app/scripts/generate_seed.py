#!/usr/bin/env python3
"""Generate NADMO-WMS seed.sql with all 261 Ghana MMDAs from LGS data."""

import re
import textwrap
from pathlib import Path

# Region metadata: code, name, capital, risk_profile, approx lat/lon for regional warehouse
REGIONS = [
    ("AH", "Ahafo Region", "Goaso", "'{\"flood\": 3, \"drought\": 2, \"fire\": 4}'", 6.7833, -2.5167),
    ("AS", "Ashanti Region", "Kumasi", "'{\"flood\": 4, \"drought\": 1, \"fire\": 3}'", 6.6666, -1.6163),
    ("BE", "Bono East Region", "Techiman", "'{\"flood\": 3, \"drought\": 3, \"fire\": 2}'", 7.5854, -1.9403),
    ("BO", "Bono Region", "Sunyani", "'{\"flood\": 2, \"drought\": 2, \"fire\": 3}'", 7.3360, -2.3130),
    ("CP", "Central Region", "Cape Coast", "'{\"flood\": 5, \"drought\": 1, \"fire\": 2}'", 5.1053, -1.2466),
    ("EP", "Eastern Region", "Koforidua", "'{\"flood\": 4, \"drought\": 2, \"fire\": 3}'", 6.0945, -0.2609),
    ("GA", "Greater Accra Region", "Accra", "'{\"flood\": 5, \"drought\": 1, \"fire\": 4, \"earthquake\": 4}'", 5.6037, -0.1870),
    ("NE", "North East Region", "Nalerigu", "'{\"flood\": 3, \"drought\": 4, \"fire\": 2}'", 10.5167, -0.3667),
    ("NR", "Northern Region", "Tamale", "'{\"flood\": 4, \"drought\": 4, \"fire\": 3}'", 9.4008, -0.8393),
    ("OT", "Oti Region", "Dambai", "'{\"flood\": 5, \"drought\": 2, \"fire\": 2}'", 7.9833, -0.1833),
    ("SV", "Savannah Region", "Damongo", "'{\"flood\": 4, \"drought\": 4, \"fire\": 3}'", 9.0833, -1.8167),
    ("UE", "Upper East Region", "Bolgatanga", "'{\"flood\": 3, \"drought\": 5, \"fire\": 2}'", 10.7856, -0.8514),
    ("UW", "Upper West Region", "Wa", "'{\"flood\": 3, \"drought\": 5, \"fire\": 2}'", 10.0601, -2.5099),
    ("VR", "Volta Region", "Ho", "'{\"flood\": 5, \"drought\": 2, \"fire\": 2}'", 6.6111, 0.4783),
    ("WN", "Western North Region", "Sefwi Wiawso", "'{\"flood\": 4, \"drought\": 1, \"fire\": 3}'", 6.2167, -2.4833),
    ("WR", "Western Region", "Sekondi-Takoradi", "'{\"flood\": 4, \"drought\": 1, \"fire\": 3}'", 4.9435, -1.7169),
]

# Districts sourced from lgs.gov.gh (Local Government Service, Ghana), 2025.
# Tuple: (region_code, district_name, capital)
DISTRICTS_RAW = [
    # ASHANTI (43)
    ("AS", "Kumasi Metropolitan", "Kumasi"),
    ("AS", "Ahafo Ano North Municipal", "Tepa"),
    ("AS", "Asante Akim Central Municipal", "Konongo-Odumase"),
    ("AS", "Asante Akim South Municipal", "Juaso"),
    ("AS", "Asokore Mampong Municipal", "Asokore"),
    ("AS", "Asokwa Municipal", "Asokwa"),
    ("AS", "Atwima Nwabiagya Municipal", "Nkawie"),
    ("AS", "Bekwai Municipal", "Bekwai"),
    ("AS", "Ejisu Municipal", "Ejisu"),
    ("AS", "Ejura Sekyredumasi Municipal", "Ejura"),
    ("AS", "Juaben Municipal", "Juaben"),
    ("AS", "Kwabre East Municipal", "Mamponteng"),
    ("AS", "Kwadaso Municipal", "Kwadaso"),
    ("AS", "Mampong Municipal", "Mampong"),
    ("AS", "Obuasi Municipal", "Obuasi"),
    ("AS", "Offinso Municipal", "Offinso"),
    ("AS", "Oforikrom Municipal", "Oforikrom"),
    ("AS", "Old Tafo Municipal", "Old Tafo"),
    ("AS", "Suame Municipal", "Suame"),
    ("AS", "Adansi Asokwa District", "Asokwa"),
    ("AS", "Adansi North District", "Fomena"),
    ("AS", "Adansi South District", "New Edubiase"),
    ("AS", "Afigya Kwabre North District", "Boaman"),
    ("AS", "Afigya Kwabre South District", "Kodie"),
    ("AS", "Ahafo Ano South East District", "Mankranso"),
    ("AS", "Ahafo Ano South West District", "Adugyama/Dwinyama"),
    ("AS", "Akrofuom District", "Akrofuom"),
    ("AS", "Amansie Central District", "Jacobu"),
    ("AS", "Amansie South District", "Edubia"),
    ("AS", "Amansie West District", "Manso-Nkwanta"),
    ("AS", "Asante Akim North District", "Agogo"),
    ("AS", "Atwima Kwanwoma District", "Foase"),
    ("AS", "Atwima Mponua District", "Nyinahin"),
    ("AS", "Atwima Nwabiagya North District", "Barekese"),
    ("AS", "Bosome Freho District", "Asiwa"),
    ("AS", "Bosomtwe District", "Kuntenase"),
    ("AS", "Obuasi East District", "Tutuka"),
    ("AS", "Offinso North District", "Akomadan"),
    ("AS", "Sekyere Afram Plains District", "Drobonso"),
    ("AS", "Sekyere Central District", "Nsuta"),
    ("AS", "Sekyere East District", "Effiduase"),
    ("AS", "Sekyere Kumawu District", "Kumawu"),
    ("AS", "Sekyere South District", "Agona"),
    # AHAFO (6)
    ("AH", "Asunafo North Municipal", "Goaso"),
    ("AH", "Asutifi North District", "Kenyasi"),
    ("AH", "Tano South Municipal", "Bechem"),
    ("AH", "Asutifi South District", "Hwidiem"),
    ("AH", "Asunafo South District", "Kukuom"),
    ("AH", "Tano North Municipal", "Duayaw Nkwanta"),
    # BONO (12)
    ("BO", "Berekum East Municipal", "Berekum"),
    ("BO", "Dormaa Central Municipal", "Dormaa Ahinkro"),
    ("BO", "Jaman South Municipal", "Drobo"),
    ("BO", "Sunyani Municipal", "Sunyani"),
    ("BO", "Wenchi Municipal", "Wenchi"),
    ("BO", "Tain District", "Nsawkaw"),
    ("BO", "Jaman North District", "Sampa"),
    ("BO", "Sunyani West District", "Odumasi"),
    ("BO", "Dormaa East District", "Wamfie"),
    ("BO", "Banda District", "Banda Ahenkro"),
    ("BO", "Dormaa West District", "Nkran Nkwanta"),
    ("BO", "Berekum West District", "Jinijini"),
    # BONO EAST (11)
    ("BE", "Atebubu Amantin Municipal", "Atebubu"),
    ("BE", "Kintampo North Municipal", "Kintampo"),
    ("BE", "Nkoranza South Municipal", "Nkoranza"),
    ("BE", "Techiman Municipal", "Techiman"),
    ("BE", "Sene West District", "Kwame Danso"),
    ("BE", "Pru East District", "Yeji"),
    ("BE", "Kintampo South District", "Jema"),
    ("BE", "Nkoranza North District", "Busunya"),
    ("BE", "Techiman North District", "Tuobodom"),
    ("BE", "Sene East District", "Kajaji"),
    ("BE", "Pru West District", "Prang"),
    # CENTRAL (22)
    ("CP", "Cape Coast Metropolitan", "Cape Coast"),
    ("CP", "Agona West Municipal", "Swedru"),
    ("CP", "Assin Fosu Municipal", "Assin Fosu"),
    ("CP", "Awutu Senya East Municipal", "Kasoa"),
    ("CP", "Effutu Municipal", "Winneba"),
    ("CP", "Komenda-Edina-Eguafo-Abrim Municipal", "Elmina"),
    ("CP", "Mfantsiman Municipal", "Saltpond"),
    ("CP", "Upper Denkyira East Municipal", "Dunkwa-on-Offin"),
    ("CP", "Abura/Asebu/Kwamankese District", "Abura Dunkwa"),
    ("CP", "Agona East District", "Nsaba"),
    ("CP", "Ajumako/Enyan/Esiam District", "Ajumako"),
    ("CP", "Asikuma-Odoben-Brakwa District", "Breman Asikuma"),
    ("CP", "Assin North District", "Assin Bereku"),
    ("CP", "Assin South District", "Kyekewere/Nsuaem"),
    ("CP", "Awutu Senya District", "Awutu Beraku"),
    ("CP", "Ekumfi District", "Essarkyir"),
    ("CP", "Gomoa Central District", "Afransi"),
    ("CP", "Gomoa East District", "Potsin"),
    ("CP", "Gomoa West District", "Apam"),
    ("CP", "Hemang Lower Denkyira District", "Hemang"),
    ("CP", "Twifu Ati Morkwa District", "Twifu Praso"),
    ("CP", "Upper Denkyira West District", "Diaso"),
    # EASTERN (33)
    ("EP", "Abuakwa North Municipal", "Kukurantumi"),
    ("EP", "Abuakwa South Municipal", "Kibi"),
    ("EP", "Akwapim North Municipal", "Akropong Akwapim"),
    ("EP", "Birim Central Municipal", "Akim Oda"),
    ("EP", "Kwaebibirem Municipal", "Kade"),
    ("EP", "Kwahu West Municipal", "Nkawkaw"),
    ("EP", "Lower Manya Krobo Municipal", "Odumase Krobo"),
    ("EP", "New Juaben North Municipal", "Effiduase"),
    ("EP", "New Juaben South Municipal", "Koforidua"),
    ("EP", "Nsawam Adoagyiri Municipal", "Nsawam"),
    ("EP", "Suhum Municipal", "Suhum"),
    ("EP", "West Akim Municipal", "Asamakese"),
    ("EP", "Yilo Krobo Municipal", "Somanya"),
    ("EP", "Achiase District", "Achiase"),
    ("EP", "Akuapem South District", "Aburi"),
    ("EP", "Akyemansa District", "Ofoase"),
    ("EP", "Asene-Manso-Akroso District", "Manso"),
    ("EP", "Asuogyaman District", "Atimpoku"),
    ("EP", "Atiwa East District", "Anyinam"),
    ("EP", "Atiwa West District", "Kwabeng"),
    ("EP", "Ayensuano District", "Coaltar"),
    ("EP", "Birim North District", "New Abirem"),
    ("EP", "Birim South District", "Akim Swedru"),
    ("EP", "Denkyembour District", "Akwatia"),
    ("EP", "Fanteakwa North District", "Begoro"),
    ("EP", "Fanteakwa South District", "Osino"),
    ("EP", "Kwahu Afram Plains North District", "Donkorkrom"),
    ("EP", "Kwahu Afram Plains South District", "Tease"),
    ("EP", "Kwahu East District", "Abetifi"),
    ("EP", "Kwahu South District", "Mpraeso"),
    ("EP", "Okere District", "Adukrom"),
    ("EP", "Upper Manya Krobo District", "Asesewa"),
    ("EP", "Upper West Akim District", "Adeiso"),
    # GREATER ACCRA (29)
    ("GA", "Accra Metropolitan", "Accra"),
    ("GA", "Tema Metropolitan", "Tema"),
    ("GA", "Ablekuma Central Municipal", "Latebiokorshie"),
    ("GA", "Ablekuma North Municipal", "Ablekuma North"),
    ("GA", "Ablekuma West Municipal", "Dansoman"),
    ("GA", "Adenta Municipal", "Adenta"),
    ("GA", "Ashaiman Municipal", "Ashaiman"),
    ("GA", "Ayawaso Central Municipal", "Kokomlemle"),
    ("GA", "Ayawaso East Municipal", "Nima"),
    ("GA", "Ayawaso North Municipal", "Accra New Town"),
    ("GA", "Ayawaso West Municipal", "Dzorwulu"),
    ("GA", "Ga South Municipal", "Ngleshie Amanfrom"),
    ("GA", "Ga Central Municipal", "Sowutuom"),
    ("GA", "Ga East Municipal", "Abokobi"),
    ("GA", "Ga North Municipal", "Ofankor"),
    ("GA", "Ga West Municipal", "Amasaman"),
    ("GA", "Korle Klottey Municipal", "Osu"),
    ("GA", "Kpone Katamanso Municipal", "Kpone"),
    ("GA", "Krowor Municipal", "Nungua"),
    ("GA", "La Dade-Kotopon Municipal", "La"),
    ("GA", "La-Nkwantanang Municipal", "Madina"),
    ("GA", "Ledzokuku Municipal", "Teshie"),
    ("GA", "Okaikwei North Municipal", "Abeka"),
    ("GA", "Tema West Municipal", "Tema Community 2"),
    ("GA", "Weija-Gbawe Municipal", "Weija"),
    ("GA", "Ada East District", "Ada Foah"),
    ("GA", "Ada West District", "Sege"),
    ("GA", "Ningo-Prampram District", "Prampram"),
    ("GA", "Shai-Osudoku District", "Dodowa"),
    # NORTH EAST (6)
    ("NE", "East Mamprusi Municipal", "Gambaga"),
    ("NE", "West Mamprusi Municipal", "Walewale"),
    ("NE", "Bunkpurugu Nakpanduri District", "Bunkpurugu"),
    ("NE", "Chereponi District", "Chereponi"),
    ("NE", "Mamprugu Moagduri District", "Yagaba"),
    ("NE", "Yunyoo Nasuan District", "Yunyoo"),
    # NORTHERN (16)
    ("NR", "Tamale Metropolitan", "Tamale"),
    ("NR", "Gushegu Municipal", "Gusheigu"),
    ("NR", "Nanumba North Municipal", "Bimbilla"),
    ("NR", "Sagnerigu Municipal", "Sagnerigu"),
    ("NR", "Savelugu Municipal", "Savelugu"),
    ("NR", "Yendi Municipal", "Yendi"),
    ("NR", "Karaga District", "Karaga"),
    ("NR", "Kpandai District", "Kpandai"),
    ("NR", "Kumbungu District", "Kumbungu"),
    ("NR", "Mion District", "Sang"),
    ("NR", "Nanton District", "Nanton"),
    ("NR", "Nanumba South District", "Wulensi"),
    ("NR", "Saboba District", "Saboba"),
    ("NR", "Tatale Sanguli District", "Tatale"),
    ("NR", "Tolon District", "Tolon"),
    ("NR", "Zabzugu District", "Zabzugu"),
    # SAVANNAH (7)
    ("SV", "Bole District", "Bole"),
    ("SV", "East Gonja Municipal", "Salaga"),
    ("SV", "West Gonja District", "Damongo"),
    ("SV", "Sawla Tuna Kalba District", "Sawla"),
    ("SV", "Central Gonja District", "Buipe"),
    ("SV", "North Gonja District", "Daboya"),
    ("SV", "North East Gonja District", "Kpalbe"),
    # UPPER EAST (15)
    ("UE", "Bawku Municipal", "Bawku"),
    ("UE", "Bolgatanga Municipal", "Bolgatanga"),
    ("UE", "Kassena Nankana East Municipal", "Navrongo"),
    ("UE", "Bawku West District", "Zebilla"),
    ("UE", "Binduri District", "Binduri"),
    ("UE", "Bolgatanga East District", "Zuarungu"),
    ("UE", "Bongo District", "Bongo"),
    ("UE", "Builsa North District", "Sandema"),
    ("UE", "Builsa South District", "Fumbisi"),
    ("UE", "Garu District", "Garu"),
    ("UE", "Kassena Nankana West District", "Paga"),
    ("UE", "Nabdam District", "Nangodi"),
    ("UE", "Pusiga District", "Pusiga"),
    ("UE", "Talensi District", "Tongo"),
    ("UE", "Tempane District", "Tempane"),
    # UPPER WEST (11)
    ("UW", "Wa Municipal", "Wa"),
    ("UW", "Jirapa Municipal", "Jirapa"),
    ("UW", "Lawra Municipal", "Lawra"),
    ("UW", "Sissala East Municipal", "Tumu"),
    ("UW", "Dafiama Bussie Issa District", "Issa"),
    ("UW", "Lambussie District", "Lambussie"),
    ("UW", "Nandom District", "Nandom"),
    ("UW", "Nadowli/Kaleo District", "Nadowli"),
    ("UW", "Sissala West District", "Tumu"),
    ("UW", "Wa East District", "Funsi"),
    ("UW", "Wa West District", "Wechiau"),
    # VOLTA (18)
    ("VR", "Adaklu District", "Adaklu Waya"),
    ("VR", "Afadzato South District", "Ve Golokwati"),
    ("VR", "Agotime-Ziope District", "Agortime Kpetoe"),
    ("VR", "Akatsi North District", "Ave-Dakpa"),
    ("VR", "Akatsi South District", "Akatsi"),
    ("VR", "Anloga District", "Anloga"),
    ("VR", "Central Tongu District", "Adidome"),
    ("VR", "Ho Municipal", "Ho"),
    ("VR", "Ho West District", "Dzolokpuita"),
    ("VR", "Hohoe Municipal", "Hohoe"),
    ("VR", "Keta Municipal", "Keta"),
    ("VR", "Ketu North Municipal", "Dzodze"),
    ("VR", "Ketu South Municipal", "Denu"),
    ("VR", "Kpando Municipal", "Kpando"),
    ("VR", "North Dayi District", "Anfoega"),
    ("VR", "North Tongu District", "Battor Dugame"),
    ("VR", "South Dayi District", "Kpeve"),
    ("VR", "South Tongu District", "Sogakope"),
    # OTI (9)
    ("OT", "Krachi East Municipal", "Dambai"),
    ("OT", "Nkwanta South Municipal", "Nkwanta"),
    ("OT", "Biakoye District", "Nkonya Ahenkro"),
    ("OT", "Jasikan District", "Jasikan"),
    ("OT", "Kadjebi District", "Kadjebi"),
    ("OT", "Krachi Nchumuru District", "Chinderi"),
    ("OT", "Krachi West District", "Kete-Krachi"),
    ("OT", "Nkwanta North District", "Kpassa"),
    ("OT", "Guan District", "Likpe-Mate"),
    # WESTERN (14)
    ("WR", "Ahanta West Municipal", "Agona Nkwanta"),
    ("WR", "Amenfi Central District", "Manso Amenfi"),
    ("WR", "Wassa Amenfi East Municipal", "Wassa Akropong"),
    ("WR", "Amenfi West Municipal", "Asankragua"),
    ("WR", "Effia Kwesimintsim Municipal", "Kwesimintim"),
    ("WR", "Ellembelle District", "Nkroful"),
    ("WR", "Jomoro Municipal", "Half-Assini"),
    ("WR", "Mpohor District", "Mpohor"),
    ("WR", "Nzema East Municipal", "Axim"),
    ("WR", "Prestea Huni-Valley Municipal", "Bogoso"),
    ("WR", "Sekondi-Takoradi Metropolitan", "Sekondi"),
    ("WR", "Shama District", "Shama"),
    ("WR", "Tarkwa Nsuaem Municipal", "Tarkwa"),
    ("WR", "Wassa East District", "Daboase"),
    # WESTERN NORTH (9)
    ("WN", "Aowin Municipal", "Enchi"),
    ("WN", "Bibiani Anhwiaso Bekwai Municipal", "Bibiani"),
    ("WN", "Sefwi Wiawso Municipal", "Sefwi Wiawso"),
    ("WN", "Bia East District", "Adabokrom"),
    ("WN", "Bia West District", "Essam-Dabiso"),
    ("WN", "Bodi District", "Bodi"),
    ("WN", "Juaboso District", "Juaboso"),
    ("WN", "Sefwi Akontombra District", "Sefwi Akontombra"),
    ("WN", "Suaman District", "Dadieso"),
]


def sql_quote(value: str | None) -> str:
    if value is None:
        return "NULL"
    # Escape single quotes
    escaped = value.replace("'", "''")
    return f"'{escaped}'"


def slugify(name: str) -> str:
    """Create a short slug for email addresses from a district/region name."""
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def main():
    # Validate counts
    counts: dict[str, int] = {}
    for region_code, _, _ in DISTRICTS_RAW:
        counts[region_code] = counts.get(region_code, 0) + 1
    print("District counts by region:")
    for code, name, *_ in REGIONS:
        print(f"  {code} ({name}): {counts.get(code, 0)}")
    total = len(DISTRICTS_RAW)
    print(f"Total districts: {total}")
    assert total == 261, f"Expected 261 districts, got {total}"

    # Build SQL
    lines: list[str] = []
    lines.append("-- Seed data for NADMO-WMS")
    lines.append("-- Sourced from the Ghana Local Government Service (lgs.gov.gh), 2025.")
    lines.append("-- Contains all 16 administrative regions and 261 Metropolitan, Municipal and District Assemblies (MMDAs).")
    lines.append("")
    lines.append("-- Enable pgcrypto for password hashing")
    lines.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    lines.append("")

    # Regions
    lines.append("-- ============================================")
    lines.append("-- REGIONS")
    lines.append("-- ============================================")
    lines.append("INSERT INTO public.regions (code, name, capital, risk_profile) VALUES")
    region_values = []
    for code, name, capital, risk, *_ in REGIONS:
        region_values.append(f"    ({sql_quote(code)}, {sql_quote(name)}, {sql_quote(capital)}, {risk}::jsonb)")
    lines.append(",\n".join(region_values) + ";")
    lines.append("")

    # Districts
    lines.append("-- ============================================")
    lines.append("-- DISTRICTS (261 MMDAs)")
    lines.append("-- ============================================")
    lines.append("INSERT INTO public.districts (region_id, name, capital, population, vulnerability_index) VALUES")
    district_values = []
    for region_code, district_name, capital in DISTRICTS_RAW:
        district_values.append(
            f"    ((SELECT id FROM public.regions WHERE code = {sql_quote(region_code)}), {sql_quote(district_name)}, {sql_quote(capital)}, NULL, NULL)"
        )
    lines.append(",\n".join(district_values) + ";")
    lines.append("")

    # Warehouses
    lines.append("-- ============================================")
    lines.append("-- WAREHOUSES")
    lines.append("-- ============================================")
    lines.append("INSERT INTO public.warehouses (district_id, code, name, type, address, latitude, longitude, capacity_m3, status, phone, email) VALUES")
    warehouse_values = []

    # HQ warehouse
    warehouse_values.append(
        "    (NULL, 'WH-HQ-ACC', 'NADMO National Headquarters Warehouse', 'hq', 'NADMO Headquarters, Accra', 5.6037, -0.1870, 5000.00, 'operational', '+233302123456', 'hq.warehouse@nadmo.gov.gh')"
    )

    # Regional warehouses
    region_phone_prefix = {
        "AH": "35", "AS": "32", "BE": "35", "BO": "35",
        "CP": "33", "EP": "34", "GA": "30", "NE": "37",
        "NR": "37", "OT": "36", "SV": "37", "UE": "38",
        "UW": "39", "VR": "36", "WN": "31", "WR": "31",
    }
    for code, name, capital, risk, lat, lon in REGIONS:
        region_slug = slugify(name.replace(" Region", ""))
        regional_phone = f"+233{region_phone_prefix[code]}123456"
        warehouse_values.append(
            f"    (NULL, 'WH-{code}-REG', {sql_quote(name.replace(' Region', ' Regional Warehouse'))}, 'regional', {sql_quote(capital + ' Regional NADMO Office')}, {lat}, {lon}, 2000.00, 'operational', {sql_quote(regional_phone)}, {sql_quote(region_slug + '@nadmo.gov.gh')})"
        )

    # District warehouses
    district_counter: dict[str, int] = {}
    for region_code, district_name, capital in DISTRICTS_RAW:
        district_counter[region_code] = district_counter.get(region_code, 0) + 1
        seq = district_counter[region_code]
        code = f"WH-{region_code}-{seq:03d}"
        name = f"{district_name} Warehouse"
        address = f"{capital} NADMO Office"
        # Use regional phone prefix with sequential suffix
        prefix = region_phone_prefix[region_code]
        phone = f"+233{prefix}{100000 + seq:06d}"
        email = f"{slugify(district_name)}@nadmo.gov.gh"
        warehouse_values.append(
            f"    ((SELECT id FROM public.districts WHERE name = {sql_quote(district_name)} AND region_id = (SELECT id FROM public.regions WHERE code = {sql_quote(region_code)})), {sql_quote(code)}, {sql_quote(name)}, 'district', {sql_quote(address)}, NULL, NULL, 500.00, 'operational', {sql_quote(phone)}, {sql_quote(email)})"
        )

    lines.append(",\n".join(warehouse_values) + ";")
    lines.append("")

    # SKU categories, SKUs, demo users, thresholds, inventory (same as before)
    lines.append(textwrap.dedent("""
        -- ============================================
        -- SKU CATEGORIES
        -- ============================================
        INSERT INTO public.sku_categories (name, code, description, default_unit, default_shelf_life_days) VALUES
        ('Food Packs', 'FOOD', 'Ready-to-eat emergency food packs', 'packs', 365),
        ('Shelter', 'SHELTER', 'Tents, tarpaulins, blankets, mattresses', 'units', 730),
        ('Medical Kits', 'MEDICAL', 'First aid and emergency medical supplies', 'kits', 730),
        ('Rescue Equipment', 'RESCUE', 'Ropes, life jackets, boats, tools', 'units', 1095),
        ('PPE', 'PPE', 'Personal protective equipment', 'units', 730),
        ('Water & Sanitation', 'WASH', 'Water purification tablets, jerry cans, hygiene kits', 'units', 730);

        -- ============================================
        -- SKUs
        -- ============================================
        INSERT INTO public.skus (sku_code, name, category_id, description, unit_of_measure, weight_kg, volume_m3, shelf_life_days) VALUES
        ('FOOD-001', 'Emergency Food Pack (family, 3-day)', (SELECT id FROM public.sku_categories WHERE code = 'FOOD'), 'Rice, beans, oil, salt for one family for 3 days', 'packs', 5.5, 0.015, 365),
        ('FOOD-002', 'High-Energy Biscuits', (SELECT id FROM public.sku_categories WHERE code = 'FOOD'), 'Fortified biscuits for emergency feeding', 'cartons', 2.0, 0.010, 180),
        ('SHELTER-001', 'Family Tent (4-person)', (SELECT id FROM public.sku_categories WHERE code = 'SHELTER'), 'Durable waterproof family tent', 'units', 25.0, 0.120, 1095),
        ('SHELTER-002', 'Tarpaulin (4x6m)', (SELECT id FROM public.sku_categories WHERE code = 'SHELTER'), 'Heavy-duty tarpaulin for shelter', 'units', 3.0, 0.008, 1095),
        ('SHELTER-003', 'Blanket', (SELECT id FROM public.sku_categories WHERE code = 'SHELTER'), 'Warm emergency blanket', 'units', 1.2, 0.003, 1095),
        ('MEDICAL-001', 'First Aid Kit (family)', (SELECT id FROM public.sku_categories WHERE code = 'MEDICAL'), 'Basic first aid supplies', 'kits', 1.5, 0.005, 730),
        ('MEDICAL-002', 'Oral Rehydration Salts', (SELECT id FROM public.sku_categories WHERE code = 'MEDICAL'), 'ORS sachets for dehydration treatment', 'boxes', 0.5, 0.002, 730),
        ('RESCUE-001', 'Life Jacket (adult)', (SELECT id FROM public.sku_categories WHERE code = 'RESCUE'), 'Adult size life jacket for flood rescue', 'units', 1.0, 0.006, 1095),
        ('PPE-001', 'Disposable Gloves (box)', (SELECT id FROM public.sku_categories WHERE code = 'PPE'), 'Nitrile examination gloves', 'boxes', 0.3, 0.002, 730),
        ('PPE-002', 'Face Mask (N95, box of 20)', (SELECT id FROM public.sku_categories WHERE code = 'PPE'), 'N95 respirator masks', 'boxes', 0.2, 0.001, 730),
        ('WASH-001', 'Water Purification Tablets', (SELECT id FROM public.sku_categories WHERE code = 'WASH'), 'Aquatabs for water treatment', 'bottles', 0.2, 0.001, 730),
        ('WASH-002', 'Jerry Can (20L)', (SELECT id FROM public.sku_categories WHERE code = 'WASH'), 'Clean water storage container', 'units', 0.8, 0.025, 1095);

        -- ============================================
        -- DEMO USERS
        -- ============================================
        -- Password for all demo accounts: NadmoWMS2026!
        DO $$
        DECLARE
            v_dg_id UUID := '11111111-1111-1111-1111-111111111111';
            v_hq_id UUID := '22222222-2222-2222-2222-222222222222';
            v_rm_ashanti_id UUID := '33333333-3333-3333-3333-333333333333';
            v_do_tema_id UUID := '44444444-4444-4444-4444-444444444444';
            v_auditor_id UUID := '55555555-5555-5555-5555-555555555555';
            v_password TEXT := crypt('NadmoWMS2026!', gen_salt('bf'));
        BEGIN
            -- Director-General
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
            VALUES (v_dg_id, 'dg@nadmo.gov.gh', v_password, now(), '{"first_name": "Kwame", "last_name": "Asante", "role": "dg"}'::jsonb, now(), now())
            ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

            -- HQ Logistics
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
            VALUES (v_hq_id, 'hq.logistics@nadmo.gov.gh', v_password, now(), '{"first_name": "Ama", "last_name": "Mensah", "role": "hq_logistics"}'::jsonb, now(), now())
            ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

            -- Regional Manager - Ashanti
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
            VALUES (v_rm_ashanti_id, 'regional.ashanti@nadmo.gov.gh', v_password, now(), '{"first_name": "Yaw", "last_name": "Boateng", "role": "regional_manager"}'::jsonb, now(), now())
            ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

            -- District Officer - Tema
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
            VALUES (v_do_tema_id, 'district.tema@nadmo.gov.gh', v_password, now(), '{"first_name": "Abena", "last_name": "Owusu", "role": "district_officer"}'::jsonb, now(), now())
            ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

            -- Auditor
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
            VALUES (v_auditor_id, 'auditor@nadmo.gov.gh', v_password, now(), '{"first_name": "Kofi", "last_name": "Addo", "role": "auditor"}'::jsonb, now(), now())
            ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

            -- Ensure profiles exist and roles are correct (trigger may set role from meta_data)
            INSERT INTO public.profiles (id, email, first_name, last_name, phone, role)
            VALUES
                (v_dg_id, 'dg@nadmo.gov.gh', 'Kwame', 'Asante', '+233201234567', 'dg'),
                (v_hq_id, 'hq.logistics@nadmo.gov.gh', 'Ama', 'Mensah', '+233202234567', 'hq_logistics'),
                (v_rm_ashanti_id, 'regional.ashanti@nadmo.gov.gh', 'Yaw', 'Boateng', '+233203234567', 'regional_manager'),
                (v_do_tema_id, 'district.tema@nadmo.gov.gh', 'Abena', 'Owusu', '+233204234567', 'district_officer'),
                (v_auditor_id, 'auditor@nadmo.gov.gh', 'Kofi', 'Addo', '+233205234567', 'auditor')
            ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                role = EXCLUDED.role,
                is_active = true;

            -- Assign warehouses
            INSERT INTO public.user_warehouses (user_id, warehouse_id, is_primary) VALUES
                -- DG and HQ can see all warehouses via RLS, but assign HQ warehouse as primary
                (v_hq_id, (SELECT id FROM public.warehouses WHERE code = 'WH-HQ-ACC'), true),
                -- Regional manager assigned to Ashanti regional warehouse
                (v_rm_ashanti_id, (SELECT id FROM public.warehouses WHERE code = 'WH-AS-REG'), true),
                -- District officer assigned to Tema Metropolitan district warehouse
                (v_do_tema_id, (SELECT id FROM public.warehouses WHERE code = 'WH-GA-002'), true)
            ON CONFLICT (user_id, warehouse_id) DO NOTHING;

            -- Default thresholds set by DG
            INSERT INTO public.warehouse_thresholds (sku_category_id, min_quantity, amber_multiplier, set_by_user_id)
            SELECT
                id,
                CASE
                    WHEN code = 'FOOD' THEN 200
                    WHEN code = 'SHELTER' THEN 50
                    WHEN code = 'MEDICAL' THEN 30
                    WHEN code = 'RESCUE' THEN 10
                    WHEN code = 'PPE' THEN 20
                    WHEN code = 'WASH' THEN 100
                END,
                1.5,
                v_dg_id
            FROM public.sku_categories
            ON CONFLICT DO NOTHING;

            -- Seed inventory for HQ warehouse (ample stock)
            INSERT INTO public.inventory (warehouse_id, sku_id, batch_lot, expiry_date, quantity, storage_location)
            SELECT
                (SELECT id FROM public.warehouses WHERE code = 'WH-HQ-ACC'),
                s.id,
                'BATCH-2026-A',
                CASE
                    WHEN s.shelf_life_days IS NOT NULL THEN CURRENT_DATE + (s.shelf_life_days || ' days')::interval
                    ELSE NULL
                END,
                CASE
                    WHEN c.code = 'FOOD' THEN 5000
                    WHEN c.code = 'SHELTER' THEN 1200
                    WHEN c.code = 'MEDICAL' THEN 800
                    WHEN c.code = 'RESCUE' THEN 300
                    WHEN c.code = 'PPE' THEN 1000
                    WHEN c.code = 'WASH' THEN 2500
                END,
                'ZONE-A'
            FROM public.skus s
            JOIN public.sku_categories c ON c.id = s.category_id
            ON CONFLICT (warehouse_id, sku_id, batch_lot) DO NOTHING;

            -- Seed inventory for Greater Accra Regional Warehouse
            INSERT INTO public.inventory (warehouse_id, sku_id, batch_lot, expiry_date, quantity, storage_location)
            SELECT
                (SELECT id FROM public.warehouses WHERE code = 'WH-GA-REG'),
                s.id,
                'BATCH-2026-A',
                CASE
                    WHEN s.shelf_life_days IS NOT NULL THEN CURRENT_DATE + (s.shelf_life_days || ' days')::interval
                    ELSE NULL
                END,
                CASE
                    WHEN c.code = 'FOOD' THEN 1500
                    WHEN c.code = 'SHELTER' THEN 350
                    WHEN c.code = 'MEDICAL' THEN 200
                    WHEN c.code = 'RESCUE' THEN 80
                    WHEN c.code = 'PPE' THEN 300
                    WHEN c.code = 'WASH' THEN 800
                END,
                'MAIN'
            FROM public.skus s
            JOIN public.sku_categories c ON c.id = s.category_id
            ON CONFLICT (warehouse_id, sku_id, batch_lot) DO NOTHING;

            -- Seed inventory for Tema Metropolitan District Warehouse (some critical items low)
            INSERT INTO public.inventory (warehouse_id, sku_id, batch_lot, expiry_date, quantity, storage_location)
            SELECT
                (SELECT id FROM public.warehouses WHERE code = 'WH-GA-002'),
                s.id,
                'BATCH-2026-A',
                CASE
                    WHEN s.shelf_life_days IS NOT NULL THEN CURRENT_DATE + (s.shelf_life_days || ' days')::interval
                    ELSE NULL
                END,
                CASE
                    WHEN c.code = 'FOOD' THEN 350
                    WHEN c.code = 'SHELTER' THEN 80
                    WHEN c.code = 'MEDICAL' THEN 45
                    WHEN c.code = 'RESCUE' THEN 18
                    WHEN c.code = 'PPE' THEN 60
                    WHEN c.code = 'WASH' THEN 180
                END,
                'STORE-1'
            FROM public.skus s
            JOIN public.sku_categories c ON c.id = s.category_id
            ON CONFLICT (warehouse_id, sku_id, batch_lot) DO NOTHING;

            -- Seed inventory for Ashanti Regional Warehouse
            INSERT INTO public.inventory (warehouse_id, sku_id, batch_lot, expiry_date, quantity, storage_location)
            SELECT
                (SELECT id FROM public.warehouses WHERE code = 'WH-AS-REG'),
                s.id,
                'BATCH-2026-A',
                CASE
                    WHEN s.shelf_life_days IS NOT NULL THEN CURRENT_DATE + (s.shelf_life_days || ' days')::interval
                    ELSE NULL
                END,
                CASE
                    WHEN c.code = 'FOOD' THEN 1200
                    WHEN c.code = 'SHELTER' THEN 280
                    WHEN c.code = 'MEDICAL' THEN 160
                    WHEN c.code = 'RESCUE' THEN 60
                    WHEN c.code = 'PPE' THEN 220
                    WHEN c.code = 'WASH' THEN 650
                END,
                'HALL-A'
            FROM public.skus s
            JOIN public.sku_categories c ON c.id = s.category_id
            ON CONFLICT (warehouse_id, sku_id, batch_lot) DO NOTHING;

        END $$;
    """).strip())
    lines.append("")

    # Write seed.sql
    output_path = Path(__file__).resolve().parent.parent / "supabase" / "seed.sql"
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
