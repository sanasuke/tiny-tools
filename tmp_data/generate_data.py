#!/usr/bin/env python3
"""
Generate data.js from ekidata.jp CSV files.
- company*.csv  : 事業者データ
- line*.csv     : 路線データ
- station*.csv  : 駅データ
- join*.csv     : 接続駅データ
"""
import csv
import os
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# 1. Load CSV data
# ============================================================

def load_csv(pattern_prefix):
    """Find and load CSV matching prefix."""
    for f in os.listdir(DIR):
        if f.startswith(pattern_prefix) and f.endswith('.csv'):
            path = os.path.join(DIR, f)
            with open(path, encoding='utf-8') as fh:
                return list(csv.DictReader(fh))
    raise FileNotFoundError(f'No CSV matching {pattern_prefix}*.csv')

companies_raw = load_csv('company')
lines_raw = load_csv('line')
stations_raw = load_csv('station')
joins_raw = load_csv('join')

# ============================================================
# 2. Build lookups
# ============================================================

# Company: company_cd -> name
company_name = {}
for row in companies_raw:
    company_name[row['company_cd']] = row['company_name']

# Lines: line_cd -> info (active only)
line_info = {}
for row in lines_raw:
    if row['e_status'] != '0':
        continue
    line_info[row['line_cd']] = {
        'line_cd': row['line_cd'],
        'company_cd': row['company_cd'],
        'name': row['line_name'],
        'color': row.get('line_color_c', '').strip().lstrip('#'),
    }

# Stations: station_cd -> info (active only)
station_info = {}
stations_by_line = defaultdict(list)  # line_cd -> [station_cd, ...]
for row in stations_raw:
    if row['e_status'] != '0':
        continue
    scd = row['station_cd']
    lcd = row['line_cd']
    if lcd not in line_info:
        continue
    lat = float(row.get('lat', 0) or 0)
    lon = float(row.get('lon', 0) or 0)
    station_info[scd] = {
        'station_cd': scd,
        'station_g_cd': row['station_g_cd'],
        'name': row['station_name'],
        'name_k': row.get('station_name_k', '').strip(),
        'line_cd': lcd,
        'pref_cd': int(row['pref_cd']),
        'e_sort': int(row['e_sort']),
        'lat': lat,
        'lon': lon,
    }
    stations_by_line[lcd].append(scd)

# Joins: adjacency per line
joins_by_line = defaultdict(list)  # line_cd -> [(scd1, scd2), ...]
for row in joins_raw:
    lcd = row['line_cd']
    s1 = row['station_cd1']
    s2 = row['station_cd2']
    if lcd in line_info and s1 in station_info and s2 in station_info:
        joins_by_line[lcd].append((s1, s2))

# ============================================================
# 3. Supplement missing line colors
# ============================================================

EXTRA_COLORS = {
    # JR
    '11302': '9ACD32',   # JR山手線
    '11312': 'F15A22',   # JR中央線快速
    '11311': 'F15A22',   # JR中央本線
    '11313': 'FFD400',   # JR中央・総武線各停
    '11332': '00B2E5',   # JR京浜東北線
    '11308': '00AC9B',   # JR埼京線
    '11301': 'F68B1E',   # JR東海道本線(東京～熱海)
    '11314': '0067C0',   # JR横須賀線
    '11303': '00818F',   # JR常磐線
    '11315': 'F15A22',   # JR総武本線
    '11321': 'F68B1E',   # JR高崎線
    '11319': 'E65100',   # JR湘南新宿ライン
    '11304': 'F68B1E',   # JR宇都宮線
    '11326': 'FFD400',   # JR南武線
    '11328': 'FF6600',   # JR武蔵野線
    '11329': '7BBB00',   # JR横浜線
    '11501': 'FF6600',   # JR大阪環状線
    '11510': '009FE8',   # JR阪和線
    '11505': 'FFD400',   # JR福知山線(宝塚線)
    '11504': '009980',   # JR東西線
    '11623': '009B4B',   # JR奈良線
    '1002': '0067C0',    # 東海道新幹線
    '1003': '0067C0',    # 山陽新幹線
    '1004': '00A651',    # 東北新幹線
    '1005': '00A651',    # 上越新幹線
    '1007': '00A651',    # 北陸新幹線
    '1008': 'E60012',    # 九州新幹線
    '1009': 'E60012',    # 西九州新幹線
    '1010': '00A651',    # 北海道新幹線
    # Toei
    '99301': 'E85298',   # 都営浅草線
    '99302': '0079C2',   # 都営三田線
    '99303': '6CBB5A',   # 都営新宿線
    '99304': 'B6007A',   # 都営大江戸線
    '99305': '008B6B',   # 日暮里・舎人ライナー
    # Tokyu
    '26001': 'E50011',   # 東急東横線
    '26002': '00A54F',   # 東急田園都市線
    '26003': '009CD2',   # 東急目黒線
    '26004': 'EE8B18',   # 東急大井町線
    '26005': 'AE0050',   # 東急池上線
    '26006': '7EC242',   # 東急多摩川線
    '26007': '019F92',   # 東急世田谷線
    '26008': 'E50011',   # 東急新横浜線
    # Odakyu
    '25001': '00A0DE',   # 小田急線
    '25002': '00A0DE',   # 小田急多摩線
    '25003': '00A0DE',   # 小田急江ノ島線
    # Keio
    '24001': 'DD0077',   # 京王線
    '24002': 'DD0077',   # 京王相模原線
    '24003': 'DD0077',   # 京王高尾線
    '24004': 'DD00AA',   # 京王井の頭線
    '24005': 'DD0077',   # 京王新線
    '24006': 'DD0077',   # 京王動物園線
    '24007': 'DD0077',   # 京王競馬場線
    # Seibu
    '22001': 'F5A623',   # 西武池袋線
    '22002': 'F5A623',   # 西武秩父線
    '22003': 'F5A623',   # 西武有楽町線
    '22004': 'F5A623',   # 西武豊島線
    '22005': 'F5A623',   # 西武狭山線
    '22006': 'F5A623',   # 西武山口線
    '22007': '3B9BDB',   # 西武新宿線
    '22008': '3B9BDB',   # 西武拝島線
    '22009': '3B9BDB',   # 西武国分寺線
    '22010': '3B9BDB',   # 西武多摩湖線
    '22011': '3B9BDB',   # 西武多摩川線
    # Tobu
    '21002': 'E44D2E',   # 東武伊勢崎線
    '21003': 'E44D2E',   # 東武日光線
    '21004': 'E44D2E',   # 東武亀戸線
    '21005': 'E44D2E',   # 東武大師線
    '21001': '0068B7',   # 東武東上線
    '21006': '0068B7',   # 東武越生線
    # Keikyu
    '27001': 'E5171F',   # 京急本線
    '27002': 'E5171F',   # 京急空港線
    '27003': 'E5171F',   # 京急逗子線
    '27004': 'E5171F',   # 京急久里浜線
    '27005': 'E5171F',   # 京急大師線
    # Keisei
    '23001': '003F8F',   # 京成本線
    '23002': '003F8F',   # 京成押上線
    '23003': '003F8F',   # 京成金町線
    '23004': '003F8F',   # 京成千葉線
    '23005': '003F8F',   # 京成千原線
    '23006': 'E85298',   # 京成成田空港線(スカイアクセス)
    '23007': '003F8F',   # 北総鉄道
    # TX
    '99310': '253292',   # つくばエクスプレス
    # Rinkai
    '99309': '00B5AD',   # りんかい線
    # Tokyo Monorail
    '99308': 'CC0000',   # 東京モノレール
    # Yurikamome
    '99307': '00A1DE',   # ゆりかもめ
    # Sotetsu
    '29001': '004E97',   # 相鉄本線
    '29002': '004E97',   # 相鉄いずみ野線
    '29003': '004E97',   # 相鉄新横浜線
    # Yokohama municipal
    '99316': '0068B7',   # 横浜市営地下鉄ブルーライン
    '99317': '6CBB5A',   # 横浜市営地下鉄グリーンライン
    # Hankyu
    '32001': '8D1A2B',   # 阪急神戸本線
    '32002': '8D1A2B',   # 阪急宝塚本線
    '32003': '8D1A2B',   # 阪急京都本線
    '32004': '8D1A2B',   # 阪急箕面線
    '32005': '8D1A2B',   # 阪急伊丹線
    '32006': '8D1A2B',   # 阪急今津線
    '32007': '8D1A2B',   # 阪急甲陽線
    '32008': '8D1A2B',   # 阪急千里線
    '32009': '8D1A2B',   # 阪急嵐山線
    # Hanshin
    '33001': 'F5A623',   # 阪神本線
    '33002': 'F5A623',   # 阪神なんば線
    '33003': 'F5A623',   # 阪神武庫川線
    # Nankai
    '34001': '009C4E',   # 南海本線
    '34002': 'E60012',   # 南海高野線
    '34003': '009C4E',   # 南海空港線
    # Kintetsu
    '31001': 'F50011',   # 近鉄奈良線
    '31002': 'F50011',   # 近鉄京都線
    '31003': 'F50011',   # 近鉄橿原線
    '31004': 'F50011',   # 近鉄天理線
    '31005': 'F50011',   # 近鉄大阪線
    '31006': 'F50011',   # 近鉄南大阪線
    '31007': 'F50011',   # 近鉄名古屋線
    # Keihan
    '35001': '009AD6',   # 京阪本線
    '35002': '009AD6',   # 京阪中之島線
    '35003': '009AD6',   # 京阪交野線
    '35004': '009AD6',   # 京阪宇治線
    '35005': '009AD6',   # 京阪京津線
    # Nishitetsu
    '36001': 'E31837',   # 西鉄天神大牟田線
    '36002': 'E31837',   # 西鉄太宰府線
    '36003': 'E31837',   # 西鉄甘木線
    # Fukuoka subway
    '99401': 'F58220',   # 福岡市営地下鉄空港線
    '99402': '0067C0',   # 福岡市営地下鉄箱崎線
    '99403': '009A3D',   # 福岡市営地下鉄七隈線
    # Sapporo subway
    '99101': '009A3D',   # 札幌市営地下鉄南北線
    '99102': '009BBF',   # 札幌市営地下鉄東西線
    '99103': '0067C0',   # 札幌市営地下鉄東豊線
    # Sendai subway
    '99201': '009A3D',   # 仙台市営地下鉄南北線
    '99202': '009BBF',   # 仙台市営地下鉄東西線
    # Meitetsu
    '30001': 'E5171F',   # 名鉄名古屋本線
    '30002': 'E5171F',   # 名鉄豊川線
    '30003': 'E5171F',   # 名鉄西尾線
    '30004': 'E5171F',   # 名鉄蒲郡線
    '30005': 'E5171F',   # 名鉄三河線
    '30006': 'E5171F',   # 名鉄豊田線
    '30007': 'E5171F',   # 名鉄常滑線
    '30008': 'E5171F',   # 名鉄空港線
    '30009': 'E5171F',   # 名鉄河和線
    '30010': 'E5171F',   # 名鉄知多新線
    '30011': 'E5171F',   # 名鉄犬山線
    '30012': 'E5171F',   # 名鉄各務原線
    '30013': 'E5171F',   # 名鉄広見線
    '30014': 'E5171F',   # 名鉄小牧線
    '30015': 'E5171F',   # 名鉄竹鼻線
    '30016': 'E5171F',   # 名鉄羽島線
    '30017': 'E5171F',   # 名鉄津島線
    '30018': 'E5171F',   # 名鉄尾西線
    '30019': 'E5171F',   # 名鉄瀬戸線
    # Misc other
    '99306': 'FF8C00',   # 東葉高速線
    '99312': '00A8A9',   # 埼玉高速鉄道
    '99311': '0068B7',   # 多摩モノレール
    '99315': 'E50011',   # みなとみらい線
    '99308': 'CC0000',   # 東京モノレール
}

# Apply colors
for lcd, color in EXTRA_COLORS.items():
    if lcd in line_info and not line_info[lcd]['color']:
        line_info[lcd]['color'] = color.upper()

# ============================================================
# 4. Build station ordering per line from join data
# ============================================================

def build_line_order(line_cd, station_cds, join_pairs):
    """Build ordered station list from join adjacency pairs."""
    if not join_pairs:
        # No joins: sort by e_sort
        return sorted(station_cds, key=lambda s: station_info[s]['e_sort'])

    # Build adjacency graph
    adj = defaultdict(list)
    for s1, s2 in join_pairs:
        if s1 in station_cds_set and s2 in station_cds_set:
            adj[s1].append(s2)
            adj[s2].append(s1)

    station_cds_set = set(station_cds)

    # Rebuild adj with the set
    adj = defaultdict(list)
    for s1, s2 in join_pairs:
        if s1 in station_cds_set and s2 in station_cds_set:
            adj[s1].append(s2)
            adj[s2].append(s1)

    # Find endpoints (degree 1) or detect circular (all degree 2)
    degrees = {s: len(adj[s]) for s in station_cds_set if s in adj}
    endpoints = [s for s, d in degrees.items() if d == 1]

    if not endpoints:
        # Possibly circular or isolated station
        if not adj:
            return sorted(station_cds, key=lambda s: station_info[s]['e_sort'])
        # Circular: start from any
        start = next(iter(adj))
        is_circular = True
    else:
        start = endpoints[0]
        is_circular = False

    # Traverse
    visited = set()
    order = []
    stack = [start]
    visited.add(start)
    order.append(start)

    while stack:
        current = stack[-1]
        found_next = False
        for nb in adj[current]:
            if nb not in visited:
                visited.add(nb)
                order.append(nb)
                stack.append(nb)
                found_next = True
                break
        if not found_next:
            stack.pop()

    # Add any unvisited stations (isolated / disconnected)
    for s in station_cds:
        if s not in visited:
            order.append(s)

    return order, is_circular


# Process each line
line_orders = {}  # line_cd -> ([station_cds_ordered], is_circular)
for lcd in line_info:
    scds = stations_by_line.get(lcd, [])
    if not scds:
        continue
    scds_set = set(scds)
    jps = [(s1, s2) for s1, s2 in joins_by_line.get(lcd, []) if s1 in scds_set and s2 in scds_set]

    if not jps:
        line_orders[lcd] = (sorted(scds, key=lambda s: station_info[s]['e_sort']), False)
        continue

    # Build adjacency
    adj = defaultdict(list)
    for s1, s2 in jps:
        adj[s1].append(s2)
        adj[s2].append(s1)

    degrees = {s: len(adj[s]) for s in scds_set if s in adj}
    endpoints = [s for s, d in degrees.items() if d == 1]

    if not endpoints:
        if not adj:
            line_orders[lcd] = (sorted(scds, key=lambda s: station_info[s]['e_sort']), False)
            continue
        start = min(adj.keys(), key=lambda s: station_info[s]['e_sort'])
        is_circular = all(d == 2 for d in degrees.values()) and len(degrees) > 2
    else:
        # Sort endpoints by e_sort to get consistent start
        start = min(endpoints, key=lambda s: station_info[s]['e_sort'])
        is_circular = False

    visited = set()
    order = []
    current = start
    visited.add(current)
    order.append(current)

    while True:
        nbs = [nb for nb in adj.get(current, []) if nb not in visited]
        if not nbs:
            break
        # Pick next unvisited neighbor (prefer lower e_sort for consistency)
        nxt = min(nbs, key=lambda s: station_info[s]['e_sort'])
        visited.add(nxt)
        order.append(nxt)
        current = nxt

    for s in scds:
        if s not in visited:
            order.append(s)

    line_orders[lcd] = (order, is_circular)

# ============================================================
# 5. Calculate per-line average inter-station time
# ============================================================

import math

def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Line type speed assumptions (km/h) based on company type
# company_type: 1=JR(新幹線), 2=JR(在来線), 3=公営, 4=私鉄, 5=第三セクター等
# We'll classify by line characteristics
LINE_SPEED_OVERRIDES = {}  # line_cd -> speed_kmh (for special cases)

# Default speeds by rough category
def guess_speed(line_cd, line_name, company_cd):
    """Estimate average speed (km/h) for a line."""
    name = line_name
    # Tram / streetcar / monorail / people mover / cable car
    if any(k in name for k in ['路面', '市電', 'ライトレール', 'ケーブル', 'ロープウェイ', 'リフト']):
        return 15
    if any(k in name for k in ['モノレール', '新交通', 'ゆりかもめ', 'ニューシャトル', 'ピーチライナー', 'リニモ']):
        return 25
    # Subway
    if any(k in name for k in ['地下鉄', '営団', 'メトロ']):
        return 33
    # Major private railways (faster suburban services)
    if any(k in name for k in ['新幹線']):
        return 200  # won't actually be used for ekidata (no shinkansen in free data)
    # JR lines
    if company_cd in ('1', '2', '3', '4', '5', '6'):  # JR companies
        return 50
    # Private railways default
    return 40

line_intervals = {}  # line_cd -> avg minutes per hop

for lcd, (order, is_circ) in line_orders.items():
    if len(order) < 2:
        line_intervals[lcd] = 2.5  # default fallback
        continue

    total_dist = 0.0
    valid_hops = 0

    for i in range(len(order) - 1):
        s1 = station_info.get(order[i])
        s2 = station_info.get(order[i + 1])
        if not s1 or not s2 or s1['lat'] == 0 or s2['lat'] == 0:
            continue
        d = haversine_km(s1['lat'], s1['lon'], s2['lat'], s2['lon'])
        total_dist += d
        valid_hops += 1

    # For circular lines, also add last→first hop
    if is_circ and len(order) > 2:
        s1 = station_info.get(order[-1])
        s2 = station_info.get(order[0])
        if s1 and s2 and s1['lat'] != 0 and s2['lat'] != 0:
            total_dist += haversine_km(s1['lat'], s1['lon'], s2['lat'], s2['lon'])
            valid_hops += 1

    if valid_hops == 0:
        line_intervals[lcd] = 2.5
        continue

    li = line_info[lcd]
    speed = guess_speed(lcd, li['name'], li.get('company_cd', ''))
    # straight-line distance * 1.3 factor for rail route curvature
    avg_dist_km = (total_dist / valid_hops) * 1.3
    avg_minutes = avg_dist_km / speed * 60
    # Clamp to reasonable range: 0.5 ~ 30 min
    avg_minutes = max(0.5, min(30.0, avg_minutes))
    line_intervals[lcd] = round(avg_minutes, 1)

# Print some stats
intervals_list = sorted(line_intervals.values())
print(f'Line interval stats: min={intervals_list[0]:.1f}, median={intervals_list[len(intervals_list)//2]:.1f}, max={intervals_list[-1]:.1f} min/hop')

# ============================================================
# 6. Prefecture names
# ============================================================

PREF_NAMES = {
    1: '北海道', 2: '青森県', 3: '岩手県', 4: '宮城県', 5: '秋田県',
    6: '山形県', 7: '福島県', 8: '茨城県', 9: '栃木県', 10: '群馬県',
    11: '埼玉県', 12: '千葉県', 13: '東京都', 14: '神奈川県', 15: '新潟県',
    16: '富山県', 17: '石川県', 18: '福井県', 19: '山梨県', 20: '長野県',
    21: '岐阜県', 22: '静岡県', 23: '愛知県', 24: '三重県', 25: '滋賀県',
    26: '京都府', 27: '大阪府', 28: '兵庫県', 29: '奈良県', 30: '和歌山県',
    31: '鳥取県', 32: '島根県', 33: '岡山県', 34: '広島県', 35: '山口県',
    36: '徳島県', 37: '香川県', 38: '愛媛県', 39: '高知県', 40: '福岡県',
    41: '佐賀県', 42: '長崎県', 43: '熊本県', 44: '大分県', 45: '宮崎県',
    46: '鹿児島県', 47: '沖縄県',
}

# ============================================================
# 7. Output data.js
# ============================================================

# Collect used prefs
used_prefs = set()
for si in station_info.values():
    used_prefs.add(si['pref_cd'])

# Collect circular line_cds
circular_lines = [lcd for lcd, (order, circ) in line_orders.items() if circ]

# Build output
out = []
out.append('// Railway data generated from ekidata.jp')
out.append('// Lines: %d, Stations: %d' % (len(line_orders), len(station_info)))
out.append('// Line format: [line_cd, name, color, [station_cds], avg_min_per_hop]')
out.append('// Station format: [station_cd, name, kana, group_id, pref_cd, lat, lon]')
out.append('')
out.append('window.RAIL_DATA = {')

# Lines
out.append('  lines: [')
sorted_lines = sorted(line_orders.keys(), key=lambda x: int(x))
for i, lcd in enumerate(sorted_lines):
    li = line_info[lcd]
    order, _ = line_orders[lcd]
    sids_str = ','.join(order)
    color = li['color'] or '999999'  # default gray
    interval = line_intervals.get(lcd, 2.5)
    comma = ',' if i < len(sorted_lines) - 1 else ''
    out.append('    [%s,"%s","%s",[%s],%s]%s' % (lcd, li['name'], color, sids_str, interval, comma))
out.append('  ],')

# Stations
out.append('  stations: [')
all_sids = sorted(station_info.keys(), key=lambda x: int(x))
for i, scd in enumerate(all_sids):
    si = station_info[scd]
    comma = ',' if i < len(all_sids) - 1 else ''
    kana = si['name_k'] or ''
    out.append('    [%s,"%s","%s",%s,%d,%s,%s]%s' % (scd, si['name'], kana, si['station_g_cd'], si['pref_cd'], round(si['lat'], 4), round(si['lon'], 4), comma))
out.append('  ],')

# Circular
out.append('  circular: [%s],' % ','.join(sorted(circular_lines, key=lambda x: int(x))))

# Pref names
out.append('  prefNames: {')
pref_items = sorted([(k, v) for k, v in PREF_NAMES.items() if k in used_prefs])
for i, (k, v) in enumerate(pref_items):
    comma = ',' if i < len(pref_items) - 1 else ''
    out.append('    %d:"%s"%s' % (k, v, comma))
out.append('  }')

out.append('};')

# Write
output_path = os.path.join(DIR, '..', 'day011_station-access', 'data.js')
content = '\n'.join(out) + '\n'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Generated {output_path}')
print(f'  Lines: {len(line_orders)}')
print(f'  Stations: {len(station_info)}')
print(f'  Circular: {len(circular_lines)} ({", ".join(line_info[c]["name"] for c in circular_lines[:5])}...)')
print(f'  File size: {len(content.encode("utf-8")):,} bytes')

# Stats: groups with multiple stations (transfers)
groups = defaultdict(list)
for si in station_info.values():
    groups[si['station_g_cd']].append(si['name'])
multi = {g: names for g, names in groups.items() if len(names) > 1}
unique_names_in_multi = sum(len(set(n)) for n in multi.values())
print(f'  Transfer groups: {len(multi)} (unique station names involved: {unique_names_in_multi})')
