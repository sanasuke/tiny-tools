#!/usr/bin/env python3
"""Inject shinkansen data into data.js (offline, no network needed).
Includes lat/lon coordinates for each station.
"""
import re
import os
import csv
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(DIR, '..', 'day011_station-access', 'data.js')

# ============================================================
# Shinkansen line definitions
# ============================================================
# Format: (line_id, name, color, avg_min_per_hop, [station_defs])
# Station def: (name, pref_cd, lat, lon)
# group_id will be resolved from ekidata or assigned new

SHINKANSEN = [
    (900001, "東海道新幹線", "0067C0", 14.6, [
        ("東京", 13, 35.6812, 139.7671),
        ("品川", 13, 35.6284, 139.7387),
        ("新横浜", 14, 35.5064, 139.6176),
        ("小田原", 14, 35.2564, 139.1554),
        ("熱海", 22, 35.1043, 139.0778),
        ("三島", 22, 35.1267, 138.9112),
        ("新富士", 22, 35.1419, 138.6656),
        ("静岡", 22, 34.9717, 138.389),
        ("掛川", 22, 34.7695, 137.998),
        ("浜松", 22, 34.7038, 137.7348),
        ("豊橋", 23, 34.7632, 137.3821),
        ("三河安城", 23, 34.9584, 137.0537),
        ("名古屋", 23, 35.1709, 136.8815),
        ("岐阜羽島", 21, 35.3152, 136.6856),
        ("米原", 25, 35.3142, 136.2906),
        ("京都", 26, 34.9858, 135.7588),
        ("新大阪", 27, 34.7334, 135.5001),
    ]),
    (900002, "山陽新幹線", "0067C0", 16.7, [
        ("新大阪", 27, 34.7334, 135.5001),
        ("新神戸", 28, 34.6887, 135.1975),
        ("西明石", 28, 34.6732, 134.9641),
        ("姫路", 28, 34.8265, 134.6914),
        ("相生", 28, 34.8058, 134.4699),
        ("岡山", 33, 34.6658, 133.9182),
        ("新倉敷", 33, 34.5935, 133.7268),
        ("福山", 34, 34.4928, 133.3644),
        ("新尾道", 34, 34.4293, 133.2241),
        ("三原", 34, 34.3984, 133.0788),
        ("東広島", 34, 34.4271, 132.7432),
        ("広島", 34, 34.3966, 132.4755),
        ("新岩国", 35, 34.1733, 132.1388),
        ("徳山", 35, 34.0498, 131.8052),
        ("新山口", 35, 34.0805, 131.4706),
        ("厚狭", 35, 34.0236, 131.1375),
        ("新下関", 35, 33.9735, 130.9483),
        ("小倉", 40, 33.8862, 130.8825),
        ("博多", 40, 33.5898, 130.4207),
    ]),
    (900003, "東北新幹線", "00A651", 10.9, [
        ("東京", 13, 35.6812, 139.7671),
        ("上野", 13, 35.7141, 139.7774),
        ("大宮", 11, 35.9062, 139.6238),
        ("小山", 9, 36.3149, 139.8007),
        ("宇都宮", 9, 36.5595, 139.8985),
        ("那須塩原", 9, 36.9624, 139.9531),
        ("新白河", 7, 37.1248, 140.1942),
        ("郡山", 7, 37.3981, 140.3884),
        ("福島", 7, 37.7543, 140.4596),
        ("白石蔵王", 4, 38.0044, 140.6122),
        ("仙台", 4, 38.2602, 140.8821),
        ("古川", 4, 38.5715, 140.9535),
        ("くりこま高原", 4, 38.7317, 141.0722),
        ("一ノ関", 3, 38.9261, 141.1267),
        ("水沢江刺", 3, 39.1155, 141.1474),
        ("北上", 3, 39.2866, 141.1131),
        ("新花巻", 3, 39.3954, 141.1101),
        ("盛岡", 3, 39.7014, 141.1365),
        ("いわて沼宮内", 3, 39.9434, 141.2119),
        ("二戸", 3, 40.2171, 141.3138),
        ("八戸", 2, 40.5126, 141.4884),
        ("七戸十和田", 2, 40.7214, 141.3025),
        ("新青森", 2, 40.8244, 140.7386),
    ]),
    (900004, "上越新幹線", "00A651", 11.1, [
        ("大宮", 11, 35.9062, 139.6238),
        ("熊谷", 11, 36.1472, 139.3886),
        ("本庄早稲田", 11, 36.2358, 139.1896),
        ("高崎", 10, 36.3222, 139.0117),
        ("上毛高原", 10, 36.6788, 138.9647),
        ("越後湯沢", 15, 36.9316, 138.8069),
        ("浦佐", 15, 37.0657, 138.9596),
        ("長岡", 15, 37.4378, 138.8494),
        ("燕三条", 15, 37.6338, 138.9396),
        ("新潟", 15, 37.9131, 139.0433),
    ]),
    (900005, "北陸新幹線", "00A651", 8.9, [
        ("高崎", 10, 36.3222, 139.0117),
        ("安中榛名", 10, 36.3635, 138.8648),
        ("軽井沢", 20, 36.3418, 138.6365),
        ("佐久平", 20, 36.2451, 138.4815),
        ("上田", 20, 36.4028, 138.1749),
        ("長野", 20, 36.643, 138.189),
        ("飯山", 20, 36.8518, 138.3656),
        ("上越妙高", 15, 37.0833, 138.2489),
        ("糸魚川", 15, 37.0466, 137.8641),
        ("黒部宇奈月温泉", 16, 36.8636, 137.5485),
        ("富山", 16, 36.7013, 137.2135),
        ("新高岡", 16, 36.7235, 137.0202),
        ("金沢", 17, 36.5781, 136.6479),
        ("小松", 17, 36.4012, 136.4451),
        ("加賀温泉", 17, 36.3097, 136.3528),
        ("芦原温泉", 18, 36.2219, 136.2277),
        ("福井", 18, 36.0623, 136.2236),
        ("越前たけふ", 18, 35.8934, 136.1816),
        ("敦賀", 18, 35.6453, 136.0575),
    ]),
    (900006, "西九州新幹線", "E60012", 7.5, [
        ("武雄温泉", 41, 33.1944, 130.0198),
        ("嬉野温泉", 41, 33.1103, 130.0464),
        ("新大村", 42, 32.9392, 129.9692),
        ("諫早", 42, 32.8543, 130.0596),
        ("長崎", 42, 32.7503, 129.8697),
    ]),
    (900007, "北海道新幹線", "00A651", 20.0, [
        ("新青森", 2, 40.8244, 140.7386),
        ("奥津軽いまべつ", 2, 41.1558, 140.4061),
        ("木古内", 1, 41.6729, 140.4456),
        ("新函館北斗", 1, 41.9046, 140.6488),
    ]),
    (900008, "山形新幹線", "9B7CB6", 12.0, [
        ("福島", 7, 37.7543, 140.4596),
        ("米沢", 6, 37.9227, 140.1072),
        ("高畠", 6, 38.0018, 140.1891),
        ("赤湯", 6, 38.0509, 140.1437),
        ("かみのやま温泉", 6, 38.1541, 140.2787),
        ("山形", 6, 38.2486, 140.3279),
        ("天童", 6, 38.3618, 140.3787),
        ("さくらんぼ東根", 6, 38.4297, 140.3904),
        ("村山", 6, 38.4859, 140.3818),
        ("大石田", 6, 38.5917, 140.3774),
        ("新庄", 6, 38.7629, 140.3165),
    ]),
    (900009, "秋田新幹線", "E7007F", 18.0, [
        ("盛岡", 3, 39.7014, 141.1365),
        ("雫石", 3, 39.6958, 140.8539),
        ("田沢湖", 5, 39.6953, 140.7264),
        ("角館", 5, 39.5913, 140.5648),
        ("大曲", 5, 39.4467, 140.4821),
        ("秋田", 5, 39.7168, 140.1289),
    ]),
    (900010, "九州新幹線", "E60012", 9.1, [
        ("博多", 40, 33.5898, 130.4207),
        ("新鳥栖", 41, 33.3229, 130.5161),
        ("久留米", 40, 33.3168, 130.4951),
        ("筑後船小屋", 40, 33.2097, 130.5105),
        ("新大牟田", 40, 33.0539, 130.4706),
        ("新玉名", 43, 32.8865, 130.5641),
        ("熊本", 43, 32.7901, 130.6868),
        ("新八代", 43, 32.5132, 130.6268),
        ("新水俣", 43, 32.2134, 130.4589),
        ("出水", 46, 32.0889, 130.3649),
        ("川内", 46, 31.8107, 130.2947),
        ("鹿児島中央", 46, 31.5842, 130.5415),
    ]),
]

# ============================================================
# Load existing group_id mapping from ekidata CSV
# ============================================================
station_csv = os.path.join(DIR, 'station20260206free.csv')
existing_groups = {}  # (name, pref_cd) -> station_g_cd
existing_coords = {}  # station_g_cd -> (lat, lon) from ekidata

with open(station_csv, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['e_status'] != '0':
            continue
        key = (row['station_name'], int(row['pref_cd']))
        gcd = row['station_g_cd']
        if key not in existing_groups:
            existing_groups[key] = gcd
        lat = float(row.get('lat', 0) or 0)
        lon = float(row.get('lon', 0) or 0)
        if gcd not in existing_coords and lat != 0:
            existing_coords[gcd] = (lat, lon)

# ============================================================
# Build injection data
# ============================================================
new_group_counter = 9900001
shinkansen_lines = []
shinkansen_stations = []
assigned_groups = {}  # (name, pref) -> group_id

for line_id, line_name, color, avg_min, stations in SHINKANSEN:
    station_ids = []
    for st_idx, (sname, pref, lat, lon) in enumerate(stations):
        sid = line_id * 100 + st_idx + 1
        station_ids.append(sid)

        # Resolve group_id
        key = (sname, pref)
        if key in existing_groups:
            gid = existing_groups[key]
        elif key in assigned_groups:
            gid = assigned_groups[key]
        else:
            gid = str(new_group_counter)
            new_group_counter += 1
            assigned_groups[key] = gid

        shinkansen_stations.append({
            'sid': sid, 'name': sname, 'gid': gid,
            'pref': pref, 'lat': round(lat, 4), 'lon': round(lon, 4),
        })

    shinkansen_lines.append({
        'lid': line_id, 'name': line_name, 'color': color,
        'sids': station_ids, 'avg': avg_min,
    })

# ============================================================
# Read and inject into data.js
# ============================================================
with open(DATA_JS, 'r', encoding='utf-8') as f:
    content = f.read()

# Build line entries
line_entries = []
for sl in shinkansen_lines:
    sids = ','.join(str(s) for s in sl['sids'])
    line_entries.append('    [%d,"%s","%s",[%s],%s]' % (
        sl['lid'], sl['name'], sl['color'], sids, sl['avg']))

# Build station entries
station_entries = []
for ss in shinkansen_stations:
    station_entries.append('    [%d,"%s","",%s,%d,%s,%s]' % (
        ss['sid'], ss['name'], ss['gid'], ss['pref'], ss['lat'], ss['lon']))

# Insert lines: find the last line entry before "  ],"
lines_end = re.search(r'(    \[\d+,"[^"]*","[^"]*",\[[^\]]*\],[^\]]*\])\n  \],\n  stations:', content)
if lines_end:
    pos = lines_end.start(1) + len(lines_end.group(1))
    insert = ',\n' + ',\n'.join(line_entries)
    content = content[:pos] + insert + content[pos:]
else:
    print('ERROR: Could not find lines array end')
    exit(1)

# Insert stations: find the last station entry before "  ],"
stations_end = re.search(r'(    \[\d+,"[^"]*","[^"]*",\d+,\d+,[0-9.]+,[0-9.]+\])\n  \],\n  circular:', content)
if stations_end:
    pos = stations_end.start(1) + len(stations_end.group(1))
    insert = ',\n' + ',\n'.join(station_entries)
    content = content[:pos] + insert + content[pos:]
else:
    print('ERROR: Could not find stations array end')
    exit(1)

# Update counts
old_count = re.search(r'// Lines: (\d+), Stations: (\d+)', content)
if old_count:
    nl = int(old_count.group(1)) + len(shinkansen_lines)
    ns = int(old_count.group(2)) + len(shinkansen_stations)
    content = content.replace(old_count.group(0), '// Lines: %d, Stations: %d' % (nl, ns))

with open(DATA_JS, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Injected {len(shinkansen_lines)} shinkansen lines, {len(shinkansen_stations)} stations')
print(f'File size: {len(content.encode("utf-8")):,} bytes')
