-- Seed data for NADMO-WMS
-- Sourced from the Ghana Local Government Service (lgs.gov.gh), 2025.
-- Contains all 16 administrative regions and 261 Metropolitan, Municipal and District Assemblies (MMDAs).

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- REGIONS
-- ============================================
INSERT INTO public.regions (code, name, capital, risk_profile) VALUES
    ('AH', 'Ahafo Region', 'Goaso', '{"flood": 3, "drought": 2, "fire": 4}'::jsonb),
    ('AS', 'Ashanti Region', 'Kumasi', '{"flood": 4, "drought": 1, "fire": 3}'::jsonb),
    ('BE', 'Bono East Region', 'Techiman', '{"flood": 3, "drought": 3, "fire": 2}'::jsonb),
    ('BO', 'Bono Region', 'Sunyani', '{"flood": 2, "drought": 2, "fire": 3}'::jsonb),
    ('CP', 'Central Region', 'Cape Coast', '{"flood": 5, "drought": 1, "fire": 2}'::jsonb),
    ('EP', 'Eastern Region', 'Koforidua', '{"flood": 4, "drought": 2, "fire": 3}'::jsonb),
    ('GA', 'Greater Accra Region', 'Accra', '{"flood": 5, "drought": 1, "fire": 4, "earthquake": 4}'::jsonb),
    ('NE', 'North East Region', 'Nalerigu', '{"flood": 3, "drought": 4, "fire": 2}'::jsonb),
    ('NR', 'Northern Region', 'Tamale', '{"flood": 4, "drought": 4, "fire": 3}'::jsonb),
    ('OT', 'Oti Region', 'Dambai', '{"flood": 5, "drought": 2, "fire": 2}'::jsonb),
    ('SV', 'Savannah Region', 'Damongo', '{"flood": 4, "drought": 4, "fire": 3}'::jsonb),
    ('UE', 'Upper East Region', 'Bolgatanga', '{"flood": 3, "drought": 5, "fire": 2}'::jsonb),
    ('UW', 'Upper West Region', 'Wa', '{"flood": 3, "drought": 5, "fire": 2}'::jsonb),
    ('VR', 'Volta Region', 'Ho', '{"flood": 5, "drought": 2, "fire": 2}'::jsonb),
    ('WN', 'Western North Region', 'Sefwi Wiawso', '{"flood": 4, "drought": 1, "fire": 3}'::jsonb),
    ('WR', 'Western Region', 'Sekondi-Takoradi', '{"flood": 4, "drought": 1, "fire": 3}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DISTRICTS (261 MMDAs)
-- ============================================
INSERT INTO public.districts (region_id, name, capital, population, vulnerability_index) VALUES
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Kumasi Metropolitan', 'Kumasi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Ahafo Ano North Municipal', 'Tepa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Asante Akim Central Municipal', 'Konongo-Odumase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Asante Akim South Municipal', 'Juaso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Asokore Mampong Municipal', 'Asokore', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Asokwa Municipal', 'Asokwa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Atwima Nwabiagya Municipal', 'Nkawie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Bekwai Municipal', 'Bekwai', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Ejisu Municipal', 'Ejisu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Ejura Sekyredumasi Municipal', 'Ejura', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Juaben Municipal', 'Juaben', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Kwabre East Municipal', 'Mamponteng', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Kwadaso Municipal', 'Kwadaso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Mampong Municipal', 'Mampong', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Obuasi Municipal', 'Obuasi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Offinso Municipal', 'Offinso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Oforikrom Municipal', 'Oforikrom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Old Tafo Municipal', 'Old Tafo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Suame Municipal', 'Suame', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Adansi Asokwa District', 'Asokwa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Adansi North District', 'Fomena', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Adansi South District', 'New Edubiase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Afigya Kwabre North District', 'Boaman', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Afigya Kwabre South District', 'Kodie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Ahafo Ano South East District', 'Mankranso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Ahafo Ano South West District', 'Adugyama/Dwinyama', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Akrofuom District', 'Akrofuom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Amansie Central District', 'Jacobu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Amansie South District', 'Edubia', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Amansie West District', 'Manso-Nkwanta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Asante Akim North District', 'Agogo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Atwima Kwanwoma District', 'Foase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Atwima Mponua District', 'Nyinahin', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Atwima Nwabiagya North District', 'Barekese', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Bosome Freho District', 'Asiwa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Bosomtwe District', 'Kuntenase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Obuasi East District', 'Tutuka', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Offinso North District', 'Akomadan', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Sekyere Afram Plains District', 'Drobonso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Sekyere Central District', 'Nsuta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Sekyere East District', 'Effiduase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Sekyere Kumawu District', 'Kumawu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AS'), 'Sekyere South District', 'Agona', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Asunafo North Municipal', 'Goaso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Asutifi North District', 'Kenyasi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Tano South Municipal', 'Bechem', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Asutifi South District', 'Hwidiem', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Asunafo South District', 'Kukuom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'AH'), 'Tano North Municipal', 'Duayaw Nkwanta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Berekum East Municipal', 'Berekum', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Dormaa Central Municipal', 'Dormaa Ahinkro', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Jaman South Municipal', 'Drobo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Sunyani Municipal', 'Sunyani', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Wenchi Municipal', 'Wenchi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Tain District', 'Nsawkaw', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Jaman North District', 'Sampa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Sunyani West District', 'Odumasi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Dormaa East District', 'Wamfie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Banda District', 'Banda Ahenkro', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Dormaa West District', 'Nkran Nkwanta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BO'), 'Berekum West District', 'Jinijini', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Atebubu Amantin Municipal', 'Atebubu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Kintampo North Municipal', 'Kintampo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Nkoranza South Municipal', 'Nkoranza', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Techiman Municipal', 'Techiman', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Sene West District', 'Kwame Danso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Pru East District', 'Yeji', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Kintampo South District', 'Jema', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Nkoranza North District', 'Busunya', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Techiman North District', 'Tuobodom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Sene East District', 'Kajaji', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'BE'), 'Pru West District', 'Prang', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Cape Coast Metropolitan', 'Cape Coast', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Agona West Municipal', 'Swedru', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Assin Fosu Municipal', 'Assin Fosu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Awutu Senya East Municipal', 'Kasoa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Effutu Municipal', 'Winneba', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Komenda-Edina-Eguafo-Abrim Municipal', 'Elmina', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Mfantsiman Municipal', 'Saltpond', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Upper Denkyira East Municipal', 'Dunkwa-on-Offin', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Abura/Asebu/Kwamankese District', 'Abura Dunkwa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Agona East District', 'Nsaba', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Ajumako/Enyan/Esiam District', 'Ajumako', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Asikuma-Odoben-Brakwa District', 'Breman Asikuma', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Assin North District', 'Assin Bereku', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Assin South District', 'Kyekewere/Nsuaem', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Awutu Senya District', 'Awutu Beraku', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Ekumfi District', 'Essarkyir', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Gomoa Central District', 'Afransi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Gomoa East District', 'Potsin', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Gomoa West District', 'Apam', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Hemang Lower Denkyira District', 'Hemang', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Twifu Ati Morkwa District', 'Twifu Praso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'CP'), 'Upper Denkyira West District', 'Diaso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Abuakwa North Municipal', 'Kukurantumi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Abuakwa South Municipal', 'Kibi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Akwapim North Municipal', 'Akropong Akwapim', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Birim Central Municipal', 'Akim Oda', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwaebibirem Municipal', 'Kade', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwahu West Municipal', 'Nkawkaw', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Lower Manya Krobo Municipal', 'Odumase Krobo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'New Juaben North Municipal', 'Effiduase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'New Juaben South Municipal', 'Koforidua', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Nsawam Adoagyiri Municipal', 'Nsawam', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Suhum Municipal', 'Suhum', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'West Akim Municipal', 'Asamakese', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Yilo Krobo Municipal', 'Somanya', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Achiase District', 'Achiase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Akuapem South District', 'Aburi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Akyemansa District', 'Ofoase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Asene-Manso-Akroso District', 'Manso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Asuogyaman District', 'Atimpoku', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Atiwa East District', 'Anyinam', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Atiwa West District', 'Kwabeng', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Ayensuano District', 'Coaltar', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Birim North District', 'New Abirem', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Birim South District', 'Akim Swedru', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Denkyembour District', 'Akwatia', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Fanteakwa North District', 'Begoro', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Fanteakwa South District', 'Osino', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwahu Afram Plains North District', 'Donkorkrom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwahu Afram Plains South District', 'Tease', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwahu East District', 'Abetifi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Kwahu South District', 'Mpraeso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Okere District', 'Adukrom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Upper Manya Krobo District', 'Asesewa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'EP'), 'Upper West Akim District', 'Adeiso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Accra Metropolitan', 'Accra', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Tema Metropolitan', 'Tema', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ablekuma Central Municipal', 'Latebiokorshie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ablekuma North Municipal', 'Ablekuma North', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ablekuma West Municipal', 'Dansoman', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Adenta Municipal', 'Adenta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ashaiman Municipal', 'Ashaiman', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ayawaso Central Municipal', 'Kokomlemle', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ayawaso East Municipal', 'Nima', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ayawaso North Municipal', 'Accra New Town', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ayawaso West Municipal', 'Dzorwulu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ga South Municipal', 'Ngleshie Amanfrom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ga Central Municipal', 'Sowutuom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ga East Municipal', 'Abokobi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ga North Municipal', 'Ofankor', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ga West Municipal', 'Amasaman', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Korle Klottey Municipal', 'Osu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Kpone Katamanso Municipal', 'Kpone', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Krowor Municipal', 'Nungua', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'La Dade-Kotopon Municipal', 'La', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'La-Nkwantanang Municipal', 'Madina', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ledzokuku Municipal', 'Teshie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Okaikwei North Municipal', 'Abeka', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Tema West Municipal', 'Tema Community 2', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Weija-Gbawe Municipal', 'Weija', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ada East District', 'Ada Foah', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ada West District', 'Sege', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Ningo-Prampram District', 'Prampram', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'GA'), 'Shai-Osudoku District', 'Dodowa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'East Mamprusi Municipal', 'Gambaga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'West Mamprusi Municipal', 'Walewale', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'Bunkpurugu Nakpanduri District', 'Bunkpurugu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'Chereponi District', 'Chereponi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'Mamprugu Moagduri District', 'Yagaba', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NE'), 'Yunyoo Nasuan District', 'Yunyoo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Tamale Metropolitan', 'Tamale', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Gushegu Municipal', 'Gusheigu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Nanumba North Municipal', 'Bimbilla', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Sagnerigu Municipal', 'Sagnerigu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Savelugu Municipal', 'Savelugu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Yendi Municipal', 'Yendi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Karaga District', 'Karaga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Kpandai District', 'Kpandai', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Kumbungu District', 'Kumbungu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Mion District', 'Sang', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Nanton District', 'Nanton', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Nanumba South District', 'Wulensi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Saboba District', 'Saboba', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Tatale Sanguli District', 'Tatale', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Tolon District', 'Tolon', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'NR'), 'Zabzugu District', 'Zabzugu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'Bole District', 'Bole', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'East Gonja Municipal', 'Salaga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'West Gonja District', 'Damongo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'Sawla Tuna Kalba District', 'Sawla', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'Central Gonja District', 'Buipe', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'North Gonja District', 'Daboya', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'SV'), 'North East Gonja District', 'Kpalbe', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Bawku Municipal', 'Bawku', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Bolgatanga Municipal', 'Bolgatanga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Kassena Nankana East Municipal', 'Navrongo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Bawku West District', 'Zebilla', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Binduri District', 'Binduri', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Bolgatanga East District', 'Zuarungu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Bongo District', 'Bongo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Builsa North District', 'Sandema', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Builsa South District', 'Fumbisi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Garu District', 'Garu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Kassena Nankana West District', 'Paga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Nabdam District', 'Nangodi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Pusiga District', 'Pusiga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Talensi District', 'Tongo', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UE'), 'Tempane District', 'Tempane', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Wa Municipal', 'Wa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Jirapa Municipal', 'Jirapa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Lawra Municipal', 'Lawra', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Sissala East Municipal', 'Tumu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Dafiama Bussie Issa District', 'Issa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Lambussie District', 'Lambussie', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Nandom District', 'Nandom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Nadowli/Kaleo District', 'Nadowli', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Sissala West District', 'Tumu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Wa East District', 'Funsi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'UW'), 'Wa West District', 'Wechiau', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Adaklu District', 'Adaklu Waya', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Afadzato South District', 'Ve Golokwati', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Agotime-Ziope District', 'Agortime Kpetoe', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Akatsi North District', 'Ave-Dakpa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Akatsi South District', 'Akatsi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Anloga District', 'Anloga', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Central Tongu District', 'Adidome', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Ho Municipal', 'Ho', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Ho West District', 'Dzolokpuita', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Hohoe Municipal', 'Hohoe', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Keta Municipal', 'Keta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Ketu North Municipal', 'Dzodze', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Ketu South Municipal', 'Denu', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'Kpando Municipal', 'Kpando', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'North Dayi District', 'Anfoega', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'North Tongu District', 'Battor Dugame', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'South Dayi District', 'Kpeve', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'VR'), 'South Tongu District', 'Sogakope', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Krachi East Municipal', 'Dambai', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Nkwanta South Municipal', 'Nkwanta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Biakoye District', 'Nkonya Ahenkro', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Jasikan District', 'Jasikan', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Kadjebi District', 'Kadjebi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Krachi Nchumuru District', 'Chinderi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Krachi West District', 'Kete-Krachi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Nkwanta North District', 'Kpassa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'OT'), 'Guan District', 'Likpe-Mate', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Ahanta West Municipal', 'Agona Nkwanta', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Amenfi Central District', 'Manso Amenfi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Wassa Amenfi East Municipal', 'Wassa Akropong', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Amenfi West Municipal', 'Asankragua', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Effia Kwesimintsim Municipal', 'Kwesimintim', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Ellembelle District', 'Nkroful', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Jomoro Municipal', 'Half-Assini', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Mpohor District', 'Mpohor', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Nzema East Municipal', 'Axim', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Prestea Huni-Valley Municipal', 'Bogoso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Sekondi-Takoradi Metropolitan', 'Sekondi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Shama District', 'Shama', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Tarkwa Nsuaem Municipal', 'Tarkwa', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WR'), 'Wassa East District', 'Daboase', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Aowin Municipal', 'Enchi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Bibiani Anhwiaso Bekwai Municipal', 'Bibiani', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Sefwi Wiawso Municipal', 'Sefwi Wiawso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Bia East District', 'Adabokrom', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Bia West District', 'Essam-Dabiso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Bodi District', 'Bodi', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Juaboso District', 'Juaboso', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Sefwi Akontombra District', 'Sefwi Akontombra', NULL, NULL),
    ((SELECT id FROM public.regions WHERE code = 'WN'), 'Suaman District', 'Dadieso', NULL, NULL)
ON CONFLICT (region_id, name) DO NOTHING;

-- ============================================
-- WAREHOUSES
-- ============================================
INSERT INTO public.warehouses (district_id, code, name, type, address, latitude, longitude, capacity_m3, status, phone, email) VALUES
    (NULL, 'WH-HQ-ACC', 'NADMO National Headquarters Warehouse', 'hq', 'NADMO Headquarters, Accra', 5.6037, -0.1870, 5000.00, 'operational', '+233302123456', 'hq.warehouse@nadmo.gov.gh'),
    (NULL, 'WH-AH-REG', 'Ahafo Regional Warehouse', 'regional', 'Goaso Regional NADMO Office', 6.7833, -2.5167, 2000.00, 'operational', '+23335123456', 'ahafo@nadmo.gov.gh'),
    (NULL, 'WH-AS-REG', 'Ashanti Regional Warehouse', 'regional', 'Kumasi Regional NADMO Office', 6.6666, -1.6163, 2000.00, 'operational', '+23332123456', 'ashanti@nadmo.gov.gh'),
    (NULL, 'WH-BE-REG', 'Bono East Regional Warehouse', 'regional', 'Techiman Regional NADMO Office', 7.5854, -1.9403, 2000.00, 'operational', '+23335123456', 'bono-east@nadmo.gov.gh'),
    (NULL, 'WH-BO-REG', 'Bono Regional Warehouse', 'regional', 'Sunyani Regional NADMO Office', 7.336, -2.313, 2000.00, 'operational', '+23335123456', 'bono@nadmo.gov.gh'),
    (NULL, 'WH-CP-REG', 'Central Regional Warehouse', 'regional', 'Cape Coast Regional NADMO Office', 5.1053, -1.2466, 2000.00, 'operational', '+23333123456', 'central@nadmo.gov.gh'),
    (NULL, 'WH-EP-REG', 'Eastern Regional Warehouse', 'regional', 'Koforidua Regional NADMO Office', 6.0945, -0.2609, 2000.00, 'operational', '+23334123456', 'eastern@nadmo.gov.gh'),
    (NULL, 'WH-GA-REG', 'Greater Accra Regional Warehouse', 'regional', 'Accra Regional NADMO Office', 5.6037, -0.187, 2000.00, 'operational', '+23330123456', 'greater-accra@nadmo.gov.gh'),
    (NULL, 'WH-NE-REG', 'North East Regional Warehouse', 'regional', 'Nalerigu Regional NADMO Office', 10.5167, -0.3667, 2000.00, 'operational', '+23337123456', 'north-east@nadmo.gov.gh'),
    (NULL, 'WH-NR-REG', 'Northern Regional Warehouse', 'regional', 'Tamale Regional NADMO Office', 9.4008, -0.8393, 2000.00, 'operational', '+23337123456', 'northern@nadmo.gov.gh'),
    (NULL, 'WH-OT-REG', 'Oti Regional Warehouse', 'regional', 'Dambai Regional NADMO Office', 7.9833, -0.1833, 2000.00, 'operational', '+23336123456', 'oti@nadmo.gov.gh'),
    (NULL, 'WH-SV-REG', 'Savannah Regional Warehouse', 'regional', 'Damongo Regional NADMO Office', 9.0833, -1.8167, 2000.00, 'operational', '+23337123456', 'savannah@nadmo.gov.gh'),
    (NULL, 'WH-UE-REG', 'Upper East Regional Warehouse', 'regional', 'Bolgatanga Regional NADMO Office', 10.7856, -0.8514, 2000.00, 'operational', '+23338123456', 'upper-east@nadmo.gov.gh'),
    (NULL, 'WH-UW-REG', 'Upper West Regional Warehouse', 'regional', 'Wa Regional NADMO Office', 10.0601, -2.5099, 2000.00, 'operational', '+23339123456', 'upper-west@nadmo.gov.gh'),
    (NULL, 'WH-VR-REG', 'Volta Regional Warehouse', 'regional', 'Ho Regional NADMO Office', 6.6111, 0.4783, 2000.00, 'operational', '+23336123456', 'volta@nadmo.gov.gh'),
    (NULL, 'WH-WN-REG', 'Western North Regional Warehouse', 'regional', 'Sefwi Wiawso Regional NADMO Office', 6.2167, -2.4833, 2000.00, 'operational', '+23331123456', 'western-north@nadmo.gov.gh'),
    (NULL, 'WH-WR-REG', 'Western Regional Warehouse', 'regional', 'Sekondi-Takoradi Regional NADMO Office', 4.9435, -1.7169, 2000.00, 'operational', '+23331123456', 'western@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kumasi Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-001', 'Kumasi Metropolitan Warehouse', 'district', 'Kumasi NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100001', 'kumasi-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ahafo Ano North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-002', 'Ahafo Ano North Municipal Warehouse', 'district', 'Tepa NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100002', 'ahafo-ano-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asante Akim Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-003', 'Asante Akim Central Municipal Warehouse', 'district', 'Konongo-Odumase NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100003', 'asante-akim-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asante Akim South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-004', 'Asante Akim South Municipal Warehouse', 'district', 'Juaso NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100004', 'asante-akim-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asokore Mampong Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-005', 'Asokore Mampong Municipal Warehouse', 'district', 'Asokore NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100005', 'asokore-mampong-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asokwa Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-006', 'Asokwa Municipal Warehouse', 'district', 'Asokwa NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100006', 'asokwa-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atwima Nwabiagya Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-007', 'Atwima Nwabiagya Municipal Warehouse', 'district', 'Nkawie NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100007', 'atwima-nwabiagya-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bekwai Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-008', 'Bekwai Municipal Warehouse', 'district', 'Bekwai NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100008', 'bekwai-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ejisu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-009', 'Ejisu Municipal Warehouse', 'district', 'Ejisu NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100009', 'ejisu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ejura Sekyredumasi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-010', 'Ejura Sekyredumasi Municipal Warehouse', 'district', 'Ejura NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100010', 'ejura-sekyredumasi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Juaben Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-011', 'Juaben Municipal Warehouse', 'district', 'Juaben NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100011', 'juaben-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwabre East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-012', 'Kwabre East Municipal Warehouse', 'district', 'Mamponteng NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100012', 'kwabre-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwadaso Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-013', 'Kwadaso Municipal Warehouse', 'district', 'Kwadaso NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100013', 'kwadaso-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Mampong Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-014', 'Mampong Municipal Warehouse', 'district', 'Mampong NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100014', 'mampong-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Obuasi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-015', 'Obuasi Municipal Warehouse', 'district', 'Obuasi NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100015', 'obuasi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Offinso Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-016', 'Offinso Municipal Warehouse', 'district', 'Offinso NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100016', 'offinso-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Oforikrom Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-017', 'Oforikrom Municipal Warehouse', 'district', 'Oforikrom NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100017', 'oforikrom-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Old Tafo Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-018', 'Old Tafo Municipal Warehouse', 'district', 'Old Tafo NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100018', 'old-tafo-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Suame Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-019', 'Suame Municipal Warehouse', 'district', 'Suame NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100019', 'suame-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Adansi Asokwa District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-020', 'Adansi Asokwa District Warehouse', 'district', 'Asokwa NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100020', 'adansi-asokwa-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Adansi North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-021', 'Adansi North District Warehouse', 'district', 'Fomena NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100021', 'adansi-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Adansi South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-022', 'Adansi South District Warehouse', 'district', 'New Edubiase NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100022', 'adansi-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Afigya Kwabre North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-023', 'Afigya Kwabre North District Warehouse', 'district', 'Boaman NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100023', 'afigya-kwabre-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Afigya Kwabre South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-024', 'Afigya Kwabre South District Warehouse', 'district', 'Kodie NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100024', 'afigya-kwabre-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ahafo Ano South East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-025', 'Ahafo Ano South East District Warehouse', 'district', 'Mankranso NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100025', 'ahafo-ano-south-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ahafo Ano South West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-026', 'Ahafo Ano South West District Warehouse', 'district', 'Adugyama/Dwinyama NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100026', 'ahafo-ano-south-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akrofuom District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-027', 'Akrofuom District Warehouse', 'district', 'Akrofuom NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100027', 'akrofuom-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Amansie Central District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-028', 'Amansie Central District Warehouse', 'district', 'Jacobu NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100028', 'amansie-central-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Amansie South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-029', 'Amansie South District Warehouse', 'district', 'Edubia NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100029', 'amansie-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Amansie West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-030', 'Amansie West District Warehouse', 'district', 'Manso-Nkwanta NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100030', 'amansie-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asante Akim North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-031', 'Asante Akim North District Warehouse', 'district', 'Agogo NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100031', 'asante-akim-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atwima Kwanwoma District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-032', 'Atwima Kwanwoma District Warehouse', 'district', 'Foase NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100032', 'atwima-kwanwoma-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atwima Mponua District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-033', 'Atwima Mponua District Warehouse', 'district', 'Nyinahin NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100033', 'atwima-mponua-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atwima Nwabiagya North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-034', 'Atwima Nwabiagya North District Warehouse', 'district', 'Barekese NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100034', 'atwima-nwabiagya-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bosome Freho District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-035', 'Bosome Freho District Warehouse', 'district', 'Asiwa NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100035', 'bosome-freho-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bosomtwe District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-036', 'Bosomtwe District Warehouse', 'district', 'Kuntenase NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100036', 'bosomtwe-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Obuasi East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-037', 'Obuasi East District Warehouse', 'district', 'Tutuka NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100037', 'obuasi-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Offinso North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-038', 'Offinso North District Warehouse', 'district', 'Akomadan NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100038', 'offinso-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekyere Afram Plains District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-039', 'Sekyere Afram Plains District Warehouse', 'district', 'Drobonso NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100039', 'sekyere-afram-plains-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekyere Central District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-040', 'Sekyere Central District Warehouse', 'district', 'Nsuta NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100040', 'sekyere-central-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekyere East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-041', 'Sekyere East District Warehouse', 'district', 'Effiduase NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100041', 'sekyere-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekyere Kumawu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-042', 'Sekyere Kumawu District Warehouse', 'district', 'Kumawu NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100042', 'sekyere-kumawu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekyere South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AS')), 'WH-AS-043', 'Sekyere South District Warehouse', 'district', 'Agona NADMO Office', NULL, NULL, 500.00, 'operational', '+23332100043', 'sekyere-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asunafo North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-001', 'Asunafo North Municipal Warehouse', 'district', 'Goaso NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100001', 'asunafo-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asutifi North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-002', 'Asutifi North District Warehouse', 'district', 'Kenyasi NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100002', 'asutifi-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tano South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-003', 'Tano South Municipal Warehouse', 'district', 'Bechem NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100003', 'tano-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asutifi South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-004', 'Asutifi South District Warehouse', 'district', 'Hwidiem NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100004', 'asutifi-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asunafo South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-005', 'Asunafo South District Warehouse', 'district', 'Kukuom NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100005', 'asunafo-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tano North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'AH')), 'WH-AH-006', 'Tano North Municipal Warehouse', 'district', 'Duayaw Nkwanta NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100006', 'tano-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Berekum East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-001', 'Berekum East Municipal Warehouse', 'district', 'Berekum NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100001', 'berekum-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Dormaa Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-002', 'Dormaa Central Municipal Warehouse', 'district', 'Dormaa Ahinkro NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100002', 'dormaa-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Jaman South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-003', 'Jaman South Municipal Warehouse', 'district', 'Drobo NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100003', 'jaman-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sunyani Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-004', 'Sunyani Municipal Warehouse', 'district', 'Sunyani NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100004', 'sunyani-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wenchi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-005', 'Wenchi Municipal Warehouse', 'district', 'Wenchi NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100005', 'wenchi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tain District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-006', 'Tain District Warehouse', 'district', 'Nsawkaw NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100006', 'tain-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Jaman North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-007', 'Jaman North District Warehouse', 'district', 'Sampa NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100007', 'jaman-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sunyani West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-008', 'Sunyani West District Warehouse', 'district', 'Odumasi NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100008', 'sunyani-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Dormaa East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-009', 'Dormaa East District Warehouse', 'district', 'Wamfie NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100009', 'dormaa-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Banda District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-010', 'Banda District Warehouse', 'district', 'Banda Ahenkro NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100010', 'banda-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Dormaa West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-011', 'Dormaa West District Warehouse', 'district', 'Nkran Nkwanta NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100011', 'dormaa-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Berekum West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BO')), 'WH-BO-012', 'Berekum West District Warehouse', 'district', 'Jinijini NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100012', 'berekum-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atebubu Amantin Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-001', 'Atebubu Amantin Municipal Warehouse', 'district', 'Atebubu NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100001', 'atebubu-amantin-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kintampo North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-002', 'Kintampo North Municipal Warehouse', 'district', 'Kintampo NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100002', 'kintampo-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nkoranza South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-003', 'Nkoranza South Municipal Warehouse', 'district', 'Nkoranza NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100003', 'nkoranza-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Techiman Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-004', 'Techiman Municipal Warehouse', 'district', 'Techiman NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100004', 'techiman-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sene West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-005', 'Sene West District Warehouse', 'district', 'Kwame Danso NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100005', 'sene-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Pru East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-006', 'Pru East District Warehouse', 'district', 'Yeji NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100006', 'pru-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kintampo South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-007', 'Kintampo South District Warehouse', 'district', 'Jema NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100007', 'kintampo-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nkoranza North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-008', 'Nkoranza North District Warehouse', 'district', 'Busunya NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100008', 'nkoranza-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Techiman North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-009', 'Techiman North District Warehouse', 'district', 'Tuobodom NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100009', 'techiman-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sene East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-010', 'Sene East District Warehouse', 'district', 'Kajaji NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100010', 'sene-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Pru West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'BE')), 'WH-BE-011', 'Pru West District Warehouse', 'district', 'Prang NADMO Office', NULL, NULL, 500.00, 'operational', '+23335100011', 'pru-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Cape Coast Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-001', 'Cape Coast Metropolitan Warehouse', 'district', 'Cape Coast NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100001', 'cape-coast-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Agona West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-002', 'Agona West Municipal Warehouse', 'district', 'Swedru NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100002', 'agona-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Assin Fosu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-003', 'Assin Fosu Municipal Warehouse', 'district', 'Assin Fosu NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100003', 'assin-fosu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Awutu Senya East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-004', 'Awutu Senya East Municipal Warehouse', 'district', 'Kasoa NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100004', 'awutu-senya-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Effutu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-005', 'Effutu Municipal Warehouse', 'district', 'Winneba NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100005', 'effutu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Komenda-Edina-Eguafo-Abrim Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-006', 'Komenda-Edina-Eguafo-Abrim Municipal Warehouse', 'district', 'Elmina NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100006', 'komenda-edina-eguafo-abrim-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Mfantsiman Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-007', 'Mfantsiman Municipal Warehouse', 'district', 'Saltpond NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100007', 'mfantsiman-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Upper Denkyira East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-008', 'Upper Denkyira East Municipal Warehouse', 'district', 'Dunkwa-on-Offin NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100008', 'upper-denkyira-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Abura/Asebu/Kwamankese District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-009', 'Abura/Asebu/Kwamankese District Warehouse', 'district', 'Abura Dunkwa NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100009', 'abura-asebu-kwamankese-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Agona East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-010', 'Agona East District Warehouse', 'district', 'Nsaba NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100010', 'agona-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ajumako/Enyan/Esiam District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-011', 'Ajumako/Enyan/Esiam District Warehouse', 'district', 'Ajumako NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100011', 'ajumako-enyan-esiam-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asikuma-Odoben-Brakwa District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-012', 'Asikuma-Odoben-Brakwa District Warehouse', 'district', 'Breman Asikuma NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100012', 'asikuma-odoben-brakwa-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Assin North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-013', 'Assin North District Warehouse', 'district', 'Assin Bereku NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100013', 'assin-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Assin South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-014', 'Assin South District Warehouse', 'district', 'Kyekewere/Nsuaem NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100014', 'assin-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Awutu Senya District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-015', 'Awutu Senya District Warehouse', 'district', 'Awutu Beraku NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100015', 'awutu-senya-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ekumfi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-016', 'Ekumfi District Warehouse', 'district', 'Essarkyir NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100016', 'ekumfi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Gomoa Central District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-017', 'Gomoa Central District Warehouse', 'district', 'Afransi NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100017', 'gomoa-central-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Gomoa East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-018', 'Gomoa East District Warehouse', 'district', 'Potsin NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100018', 'gomoa-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Gomoa West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-019', 'Gomoa West District Warehouse', 'district', 'Apam NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100019', 'gomoa-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Hemang Lower Denkyira District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-020', 'Hemang Lower Denkyira District Warehouse', 'district', 'Hemang NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100020', 'hemang-lower-denkyira-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Twifu Ati Morkwa District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-021', 'Twifu Ati Morkwa District Warehouse', 'district', 'Twifu Praso NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100021', 'twifu-ati-morkwa-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Upper Denkyira West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'CP')), 'WH-CP-022', 'Upper Denkyira West District Warehouse', 'district', 'Diaso NADMO Office', NULL, NULL, 500.00, 'operational', '+23333100022', 'upper-denkyira-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Abuakwa North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-001', 'Abuakwa North Municipal Warehouse', 'district', 'Kukurantumi NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100001', 'abuakwa-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Abuakwa South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-002', 'Abuakwa South Municipal Warehouse', 'district', 'Kibi NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100002', 'abuakwa-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akwapim North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-003', 'Akwapim North Municipal Warehouse', 'district', 'Akropong Akwapim NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100003', 'akwapim-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Birim Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-004', 'Birim Central Municipal Warehouse', 'district', 'Akim Oda NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100004', 'birim-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwaebibirem Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-005', 'Kwaebibirem Municipal Warehouse', 'district', 'Kade NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100005', 'kwaebibirem-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwahu West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-006', 'Kwahu West Municipal Warehouse', 'district', 'Nkawkaw NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100006', 'kwahu-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Lower Manya Krobo Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-007', 'Lower Manya Krobo Municipal Warehouse', 'district', 'Odumase Krobo NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100007', 'lower-manya-krobo-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'New Juaben North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-008', 'New Juaben North Municipal Warehouse', 'district', 'Effiduase NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100008', 'new-juaben-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'New Juaben South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-009', 'New Juaben South Municipal Warehouse', 'district', 'Koforidua NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100009', 'new-juaben-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nsawam Adoagyiri Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-010', 'Nsawam Adoagyiri Municipal Warehouse', 'district', 'Nsawam NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100010', 'nsawam-adoagyiri-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Suhum Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-011', 'Suhum Municipal Warehouse', 'district', 'Suhum NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100011', 'suhum-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'West Akim Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-012', 'West Akim Municipal Warehouse', 'district', 'Asamakese NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100012', 'west-akim-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Yilo Krobo Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-013', 'Yilo Krobo Municipal Warehouse', 'district', 'Somanya NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100013', 'yilo-krobo-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Achiase District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-014', 'Achiase District Warehouse', 'district', 'Achiase NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100014', 'achiase-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akuapem South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-015', 'Akuapem South District Warehouse', 'district', 'Aburi NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100015', 'akuapem-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akyemansa District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-016', 'Akyemansa District Warehouse', 'district', 'Ofoase NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100016', 'akyemansa-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asene-Manso-Akroso District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-017', 'Asene-Manso-Akroso District Warehouse', 'district', 'Manso NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100017', 'asene-manso-akroso-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Asuogyaman District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-018', 'Asuogyaman District Warehouse', 'district', 'Atimpoku NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100018', 'asuogyaman-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atiwa East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-019', 'Atiwa East District Warehouse', 'district', 'Anyinam NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100019', 'atiwa-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Atiwa West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-020', 'Atiwa West District Warehouse', 'district', 'Kwabeng NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100020', 'atiwa-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ayensuano District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-021', 'Ayensuano District Warehouse', 'district', 'Coaltar NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100021', 'ayensuano-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Birim North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-022', 'Birim North District Warehouse', 'district', 'New Abirem NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100022', 'birim-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Birim South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-023', 'Birim South District Warehouse', 'district', 'Akim Swedru NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100023', 'birim-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Denkyembour District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-024', 'Denkyembour District Warehouse', 'district', 'Akwatia NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100024', 'denkyembour-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Fanteakwa North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-025', 'Fanteakwa North District Warehouse', 'district', 'Begoro NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100025', 'fanteakwa-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Fanteakwa South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-026', 'Fanteakwa South District Warehouse', 'district', 'Osino NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100026', 'fanteakwa-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwahu Afram Plains North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-027', 'Kwahu Afram Plains North District Warehouse', 'district', 'Donkorkrom NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100027', 'kwahu-afram-plains-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwahu Afram Plains South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-028', 'Kwahu Afram Plains South District Warehouse', 'district', 'Tease NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100028', 'kwahu-afram-plains-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwahu East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-029', 'Kwahu East District Warehouse', 'district', 'Abetifi NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100029', 'kwahu-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kwahu South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-030', 'Kwahu South District Warehouse', 'district', 'Mpraeso NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100030', 'kwahu-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Okere District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-031', 'Okere District Warehouse', 'district', 'Adukrom NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100031', 'okere-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Upper Manya Krobo District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-032', 'Upper Manya Krobo District Warehouse', 'district', 'Asesewa NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100032', 'upper-manya-krobo-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Upper West Akim District' AND region_id = (SELECT id FROM public.regions WHERE code = 'EP')), 'WH-EP-033', 'Upper West Akim District Warehouse', 'district', 'Adeiso NADMO Office', NULL, NULL, 500.00, 'operational', '+23334100033', 'upper-west-akim-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Accra Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-001', 'Accra Metropolitan Warehouse', 'district', 'Accra NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100001', 'accra-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tema Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-002', 'Tema Metropolitan Warehouse', 'district', 'Tema NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100002', 'tema-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ablekuma Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-003', 'Ablekuma Central Municipal Warehouse', 'district', 'Latebiokorshie NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100003', 'ablekuma-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ablekuma North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-004', 'Ablekuma North Municipal Warehouse', 'district', 'Ablekuma North NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100004', 'ablekuma-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ablekuma West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-005', 'Ablekuma West Municipal Warehouse', 'district', 'Dansoman NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100005', 'ablekuma-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Adenta Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-006', 'Adenta Municipal Warehouse', 'district', 'Adenta NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100006', 'adenta-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ashaiman Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-007', 'Ashaiman Municipal Warehouse', 'district', 'Ashaiman NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100007', 'ashaiman-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ayawaso Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-008', 'Ayawaso Central Municipal Warehouse', 'district', 'Kokomlemle NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100008', 'ayawaso-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ayawaso East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-009', 'Ayawaso East Municipal Warehouse', 'district', 'Nima NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100009', 'ayawaso-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ayawaso North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-010', 'Ayawaso North Municipal Warehouse', 'district', 'Accra New Town NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100010', 'ayawaso-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ayawaso West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-011', 'Ayawaso West Municipal Warehouse', 'district', 'Dzorwulu NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100011', 'ayawaso-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ga South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-012', 'Ga South Municipal Warehouse', 'district', 'Ngleshie Amanfrom NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100012', 'ga-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ga Central Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-013', 'Ga Central Municipal Warehouse', 'district', 'Sowutuom NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100013', 'ga-central-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ga East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-014', 'Ga East Municipal Warehouse', 'district', 'Abokobi NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100014', 'ga-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ga North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-015', 'Ga North Municipal Warehouse', 'district', 'Ofankor NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100015', 'ga-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ga West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-016', 'Ga West Municipal Warehouse', 'district', 'Amasaman NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100016', 'ga-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Korle Klottey Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-017', 'Korle Klottey Municipal Warehouse', 'district', 'Osu NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100017', 'korle-klottey-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kpone Katamanso Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-018', 'Kpone Katamanso Municipal Warehouse', 'district', 'Kpone NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100018', 'kpone-katamanso-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Krowor Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-019', 'Krowor Municipal Warehouse', 'district', 'Nungua NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100019', 'krowor-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'La Dade-Kotopon Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-020', 'La Dade-Kotopon Municipal Warehouse', 'district', 'La NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100020', 'la-dade-kotopon-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'La-Nkwantanang Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-021', 'La-Nkwantanang Municipal Warehouse', 'district', 'Madina NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100021', 'la-nkwantanang-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ledzokuku Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-022', 'Ledzokuku Municipal Warehouse', 'district', 'Teshie NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100022', 'ledzokuku-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Okaikwei North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-023', 'Okaikwei North Municipal Warehouse', 'district', 'Abeka NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100023', 'okaikwei-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tema West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-024', 'Tema West Municipal Warehouse', 'district', 'Tema Community 2 NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100024', 'tema-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Weija-Gbawe Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-025', 'Weija-Gbawe Municipal Warehouse', 'district', 'Weija NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100025', 'weija-gbawe-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ada East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-026', 'Ada East District Warehouse', 'district', 'Ada Foah NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100026', 'ada-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ada West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-027', 'Ada West District Warehouse', 'district', 'Sege NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100027', 'ada-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ningo-Prampram District' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-028', 'Ningo-Prampram District Warehouse', 'district', 'Prampram NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100028', 'ningo-prampram-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Shai-Osudoku District' AND region_id = (SELECT id FROM public.regions WHERE code = 'GA')), 'WH-GA-029', 'Shai-Osudoku District Warehouse', 'district', 'Dodowa NADMO Office', NULL, NULL, 500.00, 'operational', '+23330100029', 'shai-osudoku-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'East Mamprusi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-001', 'East Mamprusi Municipal Warehouse', 'district', 'Gambaga NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100001', 'east-mamprusi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'West Mamprusi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-002', 'West Mamprusi Municipal Warehouse', 'district', 'Walewale NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100002', 'west-mamprusi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bunkpurugu Nakpanduri District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-003', 'Bunkpurugu Nakpanduri District Warehouse', 'district', 'Bunkpurugu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100003', 'bunkpurugu-nakpanduri-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Chereponi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-004', 'Chereponi District Warehouse', 'district', 'Chereponi NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100004', 'chereponi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Mamprugu Moagduri District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-005', 'Mamprugu Moagduri District Warehouse', 'district', 'Yagaba NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100005', 'mamprugu-moagduri-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Yunyoo Nasuan District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NE')), 'WH-NE-006', 'Yunyoo Nasuan District Warehouse', 'district', 'Yunyoo NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100006', 'yunyoo-nasuan-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tamale Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-001', 'Tamale Metropolitan Warehouse', 'district', 'Tamale NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100001', 'tamale-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Gushegu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-002', 'Gushegu Municipal Warehouse', 'district', 'Gusheigu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100002', 'gushegu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nanumba North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-003', 'Nanumba North Municipal Warehouse', 'district', 'Bimbilla NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100003', 'nanumba-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sagnerigu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-004', 'Sagnerigu Municipal Warehouse', 'district', 'Sagnerigu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100004', 'sagnerigu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-005', 'Savelugu Municipal Warehouse', 'district', 'Savelugu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100005', 'savelugu-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Yendi Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-006', 'Yendi Municipal Warehouse', 'district', 'Yendi NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100006', 'yendi-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Karaga District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-007', 'Karaga District Warehouse', 'district', 'Karaga NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100007', 'karaga-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kpandai District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-008', 'Kpandai District Warehouse', 'district', 'Kpandai NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100008', 'kpandai-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kumbungu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-009', 'Kumbungu District Warehouse', 'district', 'Kumbungu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100009', 'kumbungu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Mion District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-010', 'Mion District Warehouse', 'district', 'Sang NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100010', 'mion-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nanton District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-011', 'Nanton District Warehouse', 'district', 'Nanton NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100011', 'nanton-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nanumba South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-012', 'Nanumba South District Warehouse', 'district', 'Wulensi NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100012', 'nanumba-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Saboba District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-013', 'Saboba District Warehouse', 'district', 'Saboba NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100013', 'saboba-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tatale Sanguli District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-014', 'Tatale Sanguli District Warehouse', 'district', 'Tatale NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100014', 'tatale-sanguli-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tolon District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-015', 'Tolon District Warehouse', 'district', 'Tolon NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100015', 'tolon-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Zabzugu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'NR')), 'WH-NR-016', 'Zabzugu District Warehouse', 'district', 'Zabzugu NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100016', 'zabzugu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bole District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-001', 'Bole District Warehouse', 'district', 'Bole NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100001', 'bole-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'East Gonja Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-002', 'East Gonja Municipal Warehouse', 'district', 'Salaga NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100002', 'east-gonja-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'West Gonja District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-003', 'West Gonja District Warehouse', 'district', 'Damongo NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100003', 'west-gonja-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sawla Tuna Kalba District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-004', 'Sawla Tuna Kalba District Warehouse', 'district', 'Sawla NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100004', 'sawla-tuna-kalba-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Central Gonja District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-005', 'Central Gonja District Warehouse', 'district', 'Buipe NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100005', 'central-gonja-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'North Gonja District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-006', 'North Gonja District Warehouse', 'district', 'Daboya NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100006', 'north-gonja-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'North East Gonja District' AND region_id = (SELECT id FROM public.regions WHERE code = 'SV')), 'WH-SV-007', 'North East Gonja District Warehouse', 'district', 'Kpalbe NADMO Office', NULL, NULL, 500.00, 'operational', '+23337100007', 'north-east-gonja-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bawku Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-001', 'Bawku Municipal Warehouse', 'district', 'Bawku NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100001', 'bawku-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bolgatanga Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-002', 'Bolgatanga Municipal Warehouse', 'district', 'Bolgatanga NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100002', 'bolgatanga-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kassena Nankana East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-003', 'Kassena Nankana East Municipal Warehouse', 'district', 'Navrongo NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100003', 'kassena-nankana-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bawku West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-004', 'Bawku West District Warehouse', 'district', 'Zebilla NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100004', 'bawku-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Binduri District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-005', 'Binduri District Warehouse', 'district', 'Binduri NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100005', 'binduri-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bolgatanga East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-006', 'Bolgatanga East District Warehouse', 'district', 'Zuarungu NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100006', 'bolgatanga-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bongo District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-007', 'Bongo District Warehouse', 'district', 'Bongo NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100007', 'bongo-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Builsa North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-008', 'Builsa North District Warehouse', 'district', 'Sandema NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100008', 'builsa-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Builsa South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-009', 'Builsa South District Warehouse', 'district', 'Fumbisi NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100009', 'builsa-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Garu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-010', 'Garu District Warehouse', 'district', 'Garu NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100010', 'garu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kassena Nankana West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-011', 'Kassena Nankana West District Warehouse', 'district', 'Paga NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100011', 'kassena-nankana-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nabdam District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-012', 'Nabdam District Warehouse', 'district', 'Nangodi NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100012', 'nabdam-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Pusiga District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-013', 'Pusiga District Warehouse', 'district', 'Pusiga NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100013', 'pusiga-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Talensi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-014', 'Talensi District Warehouse', 'district', 'Tongo NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100014', 'talensi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tempane District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UE')), 'WH-UE-015', 'Tempane District Warehouse', 'district', 'Tempane NADMO Office', NULL, NULL, 500.00, 'operational', '+23338100015', 'tempane-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wa Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-001', 'Wa Municipal Warehouse', 'district', 'Wa NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100001', 'wa-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Jirapa Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-002', 'Jirapa Municipal Warehouse', 'district', 'Jirapa NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100002', 'jirapa-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Lawra Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-003', 'Lawra Municipal Warehouse', 'district', 'Lawra NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100003', 'lawra-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sissala East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-004', 'Sissala East Municipal Warehouse', 'district', 'Tumu NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100004', 'sissala-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Dafiama Bussie Issa District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-005', 'Dafiama Bussie Issa District Warehouse', 'district', 'Issa NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100005', 'dafiama-bussie-issa-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Lambussie District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-006', 'Lambussie District Warehouse', 'district', 'Lambussie NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100006', 'lambussie-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nandom District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-007', 'Nandom District Warehouse', 'district', 'Nandom NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100007', 'nandom-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nadowli/Kaleo District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-008', 'Nadowli/Kaleo District Warehouse', 'district', 'Nadowli NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100008', 'nadowli-kaleo-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sissala West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-009', 'Sissala West District Warehouse', 'district', 'Tumu NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100009', 'sissala-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wa East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-010', 'Wa East District Warehouse', 'district', 'Funsi NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100010', 'wa-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wa West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'UW')), 'WH-UW-011', 'Wa West District Warehouse', 'district', 'Wechiau NADMO Office', NULL, NULL, 500.00, 'operational', '+23339100011', 'wa-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Adaklu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-001', 'Adaklu District Warehouse', 'district', 'Adaklu Waya NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100001', 'adaklu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Afadzato South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-002', 'Afadzato South District Warehouse', 'district', 'Ve Golokwati NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100002', 'afadzato-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Agotime-Ziope District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-003', 'Agotime-Ziope District Warehouse', 'district', 'Agortime Kpetoe NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100003', 'agotime-ziope-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akatsi North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-004', 'Akatsi North District Warehouse', 'district', 'Ave-Dakpa NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100004', 'akatsi-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Akatsi South District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-005', 'Akatsi South District Warehouse', 'district', 'Akatsi NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100005', 'akatsi-south-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Anloga District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-006', 'Anloga District Warehouse', 'district', 'Anloga NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100006', 'anloga-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Central Tongu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-007', 'Central Tongu District Warehouse', 'district', 'Adidome NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100007', 'central-tongu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ho Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-008', 'Ho Municipal Warehouse', 'district', 'Ho NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100008', 'ho-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ho West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-009', 'Ho West District Warehouse', 'district', 'Dzolokpuita NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100009', 'ho-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Hohoe Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-010', 'Hohoe Municipal Warehouse', 'district', 'Hohoe NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100010', 'hohoe-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Keta Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-011', 'Keta Municipal Warehouse', 'district', 'Keta NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100011', 'keta-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ketu North Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-012', 'Ketu North Municipal Warehouse', 'district', 'Dzodze NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100012', 'ketu-north-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ketu South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-013', 'Ketu South Municipal Warehouse', 'district', 'Denu NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100013', 'ketu-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kpando Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-014', 'Kpando Municipal Warehouse', 'district', 'Kpando NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100014', 'kpando-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'North Dayi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-015', 'North Dayi District Warehouse', 'district', 'Anfoega NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100015', 'north-dayi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'North Tongu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-016', 'North Tongu District Warehouse', 'district', 'Battor Dugame NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100016', 'north-tongu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'South Dayi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-017', 'South Dayi District Warehouse', 'district', 'Kpeve NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100017', 'south-dayi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'South Tongu District' AND region_id = (SELECT id FROM public.regions WHERE code = 'VR')), 'WH-VR-018', 'South Tongu District Warehouse', 'district', 'Sogakope NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100018', 'south-tongu-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Krachi East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-001', 'Krachi East Municipal Warehouse', 'district', 'Dambai NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100001', 'krachi-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nkwanta South Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-002', 'Nkwanta South Municipal Warehouse', 'district', 'Nkwanta NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100002', 'nkwanta-south-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Biakoye District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-003', 'Biakoye District Warehouse', 'district', 'Nkonya Ahenkro NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100003', 'biakoye-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Jasikan District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-004', 'Jasikan District Warehouse', 'district', 'Jasikan NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100004', 'jasikan-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Kadjebi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-005', 'Kadjebi District Warehouse', 'district', 'Kadjebi NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100005', 'kadjebi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Krachi Nchumuru District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-006', 'Krachi Nchumuru District Warehouse', 'district', 'Chinderi NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100006', 'krachi-nchumuru-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Krachi West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-007', 'Krachi West District Warehouse', 'district', 'Kete-Krachi NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100007', 'krachi-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nkwanta North District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-008', 'Nkwanta North District Warehouse', 'district', 'Kpassa NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100008', 'nkwanta-north-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Guan District' AND region_id = (SELECT id FROM public.regions WHERE code = 'OT')), 'WH-OT-009', 'Guan District Warehouse', 'district', 'Likpe-Mate NADMO Office', NULL, NULL, 500.00, 'operational', '+23336100009', 'guan-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ahanta West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-001', 'Ahanta West Municipal Warehouse', 'district', 'Agona Nkwanta NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100001', 'ahanta-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Amenfi Central District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-002', 'Amenfi Central District Warehouse', 'district', 'Manso Amenfi NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100002', 'amenfi-central-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wassa Amenfi East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-003', 'Wassa Amenfi East Municipal Warehouse', 'district', 'Wassa Akropong NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100003', 'wassa-amenfi-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Amenfi West Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-004', 'Amenfi West Municipal Warehouse', 'district', 'Asankragua NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100004', 'amenfi-west-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Effia Kwesimintsim Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-005', 'Effia Kwesimintsim Municipal Warehouse', 'district', 'Kwesimintim NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100005', 'effia-kwesimintsim-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Ellembelle District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-006', 'Ellembelle District Warehouse', 'district', 'Nkroful NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100006', 'ellembelle-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Jomoro Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-007', 'Jomoro Municipal Warehouse', 'district', 'Half-Assini NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100007', 'jomoro-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Mpohor District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-008', 'Mpohor District Warehouse', 'district', 'Mpohor NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100008', 'mpohor-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Nzema East Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-009', 'Nzema East Municipal Warehouse', 'district', 'Axim NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100009', 'nzema-east-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Prestea Huni-Valley Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-010', 'Prestea Huni-Valley Municipal Warehouse', 'district', 'Bogoso NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100010', 'prestea-huni-valley-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sekondi-Takoradi Metropolitan' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-011', 'Sekondi-Takoradi Metropolitan Warehouse', 'district', 'Sekondi NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100011', 'sekondi-takoradi-metropolitan@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Shama District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-012', 'Shama District Warehouse', 'district', 'Shama NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100012', 'shama-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Tarkwa Nsuaem Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-013', 'Tarkwa Nsuaem Municipal Warehouse', 'district', 'Tarkwa NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100013', 'tarkwa-nsuaem-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Wassa East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WR')), 'WH-WR-014', 'Wassa East District Warehouse', 'district', 'Daboase NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100014', 'wassa-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Aowin Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-001', 'Aowin Municipal Warehouse', 'district', 'Enchi NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100001', 'aowin-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bibiani Anhwiaso Bekwai Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-002', 'Bibiani Anhwiaso Bekwai Municipal Warehouse', 'district', 'Bibiani NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100002', 'bibiani-anhwiaso-bekwai-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sefwi Wiawso Municipal' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-003', 'Sefwi Wiawso Municipal Warehouse', 'district', 'Sefwi Wiawso NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100003', 'sefwi-wiawso-municipal@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bia East District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-004', 'Bia East District Warehouse', 'district', 'Adabokrom NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100004', 'bia-east-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bia West District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-005', 'Bia West District Warehouse', 'district', 'Essam-Dabiso NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100005', 'bia-west-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Bodi District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-006', 'Bodi District Warehouse', 'district', 'Bodi NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100006', 'bodi-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Juaboso District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-007', 'Juaboso District Warehouse', 'district', 'Juaboso NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100007', 'juaboso-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Sefwi Akontombra District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-008', 'Sefwi Akontombra District Warehouse', 'district', 'Sefwi Akontombra NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100008', 'sefwi-akontombra-district@nadmo.gov.gh'),
    ((SELECT id FROM public.districts WHERE name = 'Suaman District' AND region_id = (SELECT id FROM public.regions WHERE code = 'WN')), 'WH-WN-009', 'Suaman District Warehouse', 'district', 'Dadieso NADMO Office', NULL, NULL, 500.00, 'operational', '+23331100009', 'suaman-district@nadmo.gov.gh')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SKU CATEGORIES
-- ============================================
INSERT INTO public.sku_categories (name, code, description, default_unit, default_shelf_life_days) VALUES
('Food Packs', 'FOOD', 'Ready-to-eat emergency food packs', 'packs', 365),
('Shelter', 'SHELTER', 'Tents, tarpaulins, blankets, mattresses', 'units', 730),
('Medical Kits', 'MEDICAL', 'First aid and emergency medical supplies', 'kits', 730),
('Rescue Equipment', 'RESCUE', 'Ropes, life jackets, boats, tools', 'units', 1095),
('PPE', 'PPE', 'Personal protective equipment', 'units', 730),
('Water & Sanitation', 'WASH', 'Water purification tablets, jerry cans, hygiene kits', 'units', 730)
ON CONFLICT (code) DO NOTHING;

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
('WASH-002', 'Jerry Can (20L)', (SELECT id FROM public.sku_categories WHERE code = 'WASH'), 'Clean water storage container', 'units', 0.8, 0.025, 1095)
ON CONFLICT (sku_code) DO NOTHING;

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

