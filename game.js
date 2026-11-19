'use strict';
/* ============================================================
   ドリームペナント3D 〜一生野球〜  (おちゃ自作)
   3D野球 + シーズン + 育成 + スカウト + 球場拡張 を一生ループするゲーム
   素材: Three.js(MITライブラリ) / フォント M PLUS Rounded系(同梱)
   3Dモデル・ロジック・UIは全て自作（プリミティブで選手と球場を構築）
   ============================================================ */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const rf=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const fmt=n=>Math.floor(n).toLocaleString('ja-JP');
const STAT_JP={meet:'ミート',pow:'パワー',run:'走力',def:'守備',vel:'球速',ctl:'制球',brk:'変化',sta:'体力'}; // 能力キーの日本語名（結果表示で英語キーを出さない）
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- 名前生成（自作リスト） ---------- */
const SURNAMES=['佐藤','鈴木','高橋','田中','伊藤','渡辺','山本','中村','小林','加藤','吉田','山田','佐々木','山口','松本','井上','木村','林','清水','森','池田','橋本','阿部','石川','山崎','中島','前田','藤田','後藤','岡田','村上','長谷川','近藤','坂本','遠藤','青木','藤井','福田','太田','三浦','藤原'];
const FIRSTNAMES=['翔太','蓮','大和','悠真','颯太','樹','陽翔','陸','湊','蒼','大谷翔平風','健太','拓海','龍之介','一郎','誠','剛','翼','駿','海翔','颯','悠人','結翔','朝陽','律','碧','岳','豪','仁','翔','圭太','直樹','雄大','智也','亮','慶','宗','虎太郎','獅子丸'];
const CPU_TEAMS=[
 {name:'読売ジャイアンツ',short:'巨人',color:0xe8641c,base:7,realTeam:'巨人'},
 {name:'阪神タイガース',short:'阪神',color:0xc9a800,base:7,realTeam:'阪神'},
 {name:'福岡ソフトバンクホークス',short:'SB',color:0xd9a400,base:8,realTeam:'ソフトバンク'},
 {name:'横浜DeNAベイスターズ',short:'DeNA',color:0x009ad6,base:6,realTeam:'DeNA'},
 {name:'広島東洋カープ',short:'広島',color:0xe60012,base:6,realTeam:'広島'},
];
const WORLD_TEAM={name:'MLB選抜 ワールドスターズ',short:'MLB',color:0x1b2a6b,base:9,realTeam:'MLB'};
/* ============================================================
   実在選手データ（氏名・球団・能力値は公知の事実情報ベースの目安）
   顔写真は著作権・肖像権のため使用せず、顔は全て自作の生成アートで表現する
   形式: 名前|球団|守備|B(打者)/P(投手)|能力4つ(打者:ミート,パワー,走,守 / 投手:球速,制球,変化,体力)
   ============================================================ */
const REAL_RAW=`
岡本和真|巨人|一塁|B|78,92,55,70
吉川尚輝|巨人|二塁|B|82,62,78,88
坂本勇人|巨人|遊撃|B|76,74,50,80
門脇誠|巨人|遊撃|B|72,55,82,85
丸佳浩|巨人|右翼|B|74,76,58,66
戸郷翔征|巨人|投手|P|88,80,78,85
山﨑伊織|巨人|投手|P|84,86,74,82
マルティネス|巨人|投手|P|96,84,72,40
近本光司|阪神|中堅|B|84,58,92,84
中野拓夢|阪神|二塁|B|80,52,84,82
佐藤輝明|阪神|右翼|B|68,95,60,62
大山悠輔|阪神|一塁|B|74,86,45,72
森下翔太|阪神|左翼|B|76,84,62,64
村上頌樹|阪神|投手|P|86,90,80,86
才木浩人|阪神|投手|P|92,78,82,84
岩崎優|阪神|投手|P|88,82,70,38
牧秀悟|DeNA|二塁|B|80,88,52,74
宮﨑敏郎|DeNA|三塁|B|84,72,38,78
佐野恵太|DeNA|一塁|B|78,70,55,60
桑原将志|DeNA|中堅|B|74,64,76,80
筒香嘉智|DeNA|左翼|B|66,88,40,55
東克樹|DeNA|投手|P|86,88,76,88
ジャクソン|DeNA|投手|P|90,74,80,80
伊勢大夢|DeNA|投手|P|90,76,72,40
小園海斗|広島|遊撃|B|82,60,74,80
菊池涼介|広島|二塁|B|76,55,66,95
坂倉将吾|広島|捕手|B|78,78,42,70
秋山翔吾|広島|中堅|B|78,66,60,78
末包昇大|広島|右翼|B|62,90,48,50
森下暢仁|広島|投手|P|88,84,78,86
床田寛樹|広島|投手|P|85,86,72,86
栗林良吏|広島|投手|P|92,80,78,38
村上宗隆|ヤクルト|三塁|B|72,97,55,58
山田哲人|ヤクルト|二塁|B|76,80,78,72
長岡秀樹|ヤクルト|遊撃|B|80,58,72,84
オスナ|ヤクルト|一塁|B|74,84,50,66
サンタナ|ヤクルト|左翼|B|78,82,48,55
吉村貢司郎|ヤクルト|投手|P|86,78,74,82
高橋奎二|ヤクルト|投手|P|88,72,76,80
田口麗斗|ヤクルト|投手|P|84,80,70,40
岡林勇希|中日|中堅|B|80,50,90,84
細川成也|中日|右翼|B|70,90,55,58
石川昂弥|中日|三塁|B|66,84,42,64
村松開人|中日|遊撃|B|74,52,80,80
カリステ|中日|三塁|B|72,74,66,70
高橋宏斗|中日|投手|P|95,82,84,88
柳裕也|中日|投手|P|84,84,78,84
松葉貴大|中日|投手|P|82,88,70,82
近藤健介|ソフトバンク|左翼|B|88,84,50,66
柳田悠岐|ソフトバンク|右翼|B|84,92,66,62
山川穂高|ソフトバンク|一塁|B|64,96,38,50
周東佑京|ソフトバンク|中堅|B|72,42,99,78
栗原陵矢|ソフトバンク|三塁|B|76,78,55,70
有原航平|ソフトバンク|投手|P|88,84,74,88
モイネロ|ソフトバンク|投手|P|93,78,86,84
オスナ|ソフトバンク|投手|P|97,82,74,38
清宮幸太郎|日本ハム|一塁|B|68,90,45,52
万波中正|日本ハム|右翼|B|66,93,68,72
水谷瞬|日本ハム|左翼|B|78,72,84,70
郡司裕也|日本ハム|捕手|B|76,72,50,72
レイエス|日本ハム|DH|B|70,92,40,48
伊藤大海|日本ハム|投手|P|90,82,84,88
山﨑福也|日本ハム|投手|P|84,86,74,84
達孝太|日本ハム|投手|P|90,74,78,82
佐藤都志也|ロッテ|捕手|B|78,74,48,74
ポランコ|ロッテ|左翼|B|62,94,36,45
ソト|ロッテ|一塁|B|72,88,38,58
藤岡裕大|ロッテ|遊撃|B|74,55,74,82
中村奨吾|ロッテ|二塁|B|72,66,70,74
小島和哉|ロッテ|投手|P|85,84,74,86
種市篤暉|ロッテ|投手|P|92,74,82,82
益田直也|ロッテ|投手|P|88,80,72,38
浅村栄斗|楽天|二塁|B|76,86,48,64
辰己涼介|楽天|中堅|B|78,62,88,86
小深田大翔|楽天|遊撃|B|76,50,86,80
島内宏明|楽天|左翼|B|78,74,42,60
フランコ|楽天|三塁|B|64,88,40,50
早川隆久|楽天|投手|P|88,82,78,86
藤井聖|楽天|投手|P|86,80,74,82
則本昂大|楽天|投手|P|90,76,80,60
源田壮亮|西武|遊撃|B|78,52,86,90
外崎修汰|西武|二塁|B|72,72,64,74
西川愛也|西武|中堅|B|76,60,88,76
佐藤龍世|西武|三塁|B|68,80,48,60
セデーニョ|西武|一塁|B|62,90,36,48
今井達也|西武|投手|P|96,76,86,90
隅田知一郎|西武|投手|P|90,82,80,86
平良海馬|西武|投手|P|94,78,80,50
森友哉|オリックス|捕手|B|80,84,44,72
紅林弘太郎|オリックス|遊撃|B|74,72,52,84
宗佑磨|オリックス|三塁|B|74,70,72,84
西野真弘|オリックス|二塁|B|76,58,70,76
来田涼斗|オリックス|中堅|B|72,66,80,72
宮城大弥|オリックス|投手|P|90,86,82,86
山下舜平大|オリックス|投手|P|96,70,80,84
曽谷龍平|オリックス|投手|P|88,78,76,84
大谷翔平|ドジャース|DH|B|90,99,90,55
山本由伸|ドジャース|投手|P|97,90,90,90
佐々木朗希|ドジャース|投手|P|99,72,84,70
今永昇太|カブス|投手|P|89,86,86,86
千賀滉大|メッツ|投手|P|93,76,95,82
菅野智之|オリオールズ|投手|P|86,90,80,84
鈴木誠也|カブス|右翼|B|82,86,62,64
吉田正尚|レッドソックス|左翼|B|84,74,48,55
ヌートバー|カージナルス|中堅|B|78,76,74,72
ジャッジ|ヤンキース|右翼|B|84,99,58,70
ソト|メッツ|右翼|B|88,95,55,60
アクーニャJr.|ブレーブス|右翼|B|86,92,97,78
ベッツ|ドジャース|遊撃|B|86,84,90,90
フリーマン|ドジャース|一塁|B|88,86,45,74
ハーパー|フィリーズ|一塁|B|84,94,58,62
タティスJr.|パドレス|右翼|B|82,90,92,84
ゲレーロJr.|ブルージェイズ|一塁|B|86,94,42,58
トラウト|エンゼルス|中堅|B|84,93,78,72
スキーンズ|パイレーツ|投手|P|99,84,90,90
ウィットJr.|ロイヤルズ|遊撃|B|86,88,98,90
ヘンダーソン|オリオールズ|遊撃|B|82,90,84,86
スクーバル|タイガース|投手|P|96,88,88,90
ラッチマン|オリオールズ|捕手|B|80,78,44,84
フリオ・ロドリゲス|マリナーズ|中堅|B|80,86,90,82
金河成|レイズ|遊撃|B|76,68,82,90
李政厚|ジャイアンツ(MLB)|中堅|B|82,70,78,80
ダルビッシュ有|パドレス|投手|P|91,86,92,80
松井裕樹|パドレス|投手|P|92,80,84,40
菊池雄星|エンゼルス|投手|P|90,78,80,84
コービン・キャロル|Dバックス|中堅|B|82,80,96,84
`;
const MLB_TEAMS=['ドジャース','カブス','メッツ','オリオールズ','レッドソックス','カージナルス','ヤンキース','ブレーブス','フィリーズ','パドレス','ブルージェイズ','エンゼルス','パイレーツ','ロイヤルズ','タイガース','マリナーズ','レイズ','ジャイアンツ(MLB)','Dバックス'];
const REAL_PLAYERS=REAL_RAW.trim().split('\n').map(line=>{const [n,t,pos,k,st]=line.trim().split('|');const v=st.split(',').map(Number);
  const p={name:n,team:t,pos,kind:k,real:true,mlb:MLB_TEAMS.includes(t)};
  if(k==='B'){p.meet=v[0];p.pow=v[1];p.run=v[2];p.def=v[3];p.vel=40;p.ctl=40;p.brk=40;p.sta=50;}
  else{p.vel=v[0];p.ctl=v[1];p.brk=v[2];p.sta=v[3];p.meet=35;p.pow=35;p.run=45;p.def=60;}
  return p;});
const NUMBERS={'大谷翔平':17,'山本由伸':18,'佐々木朗希':17,'岡本和真':25,'村上宗隆':55,'坂本勇人':6,'近本光司':5,'佐藤輝明':8,'大山悠輔':3,'柳田悠岐':9,'近藤健介':3,'今井達也':48,'戸郷翔征':20,'ジャッジ':99,'トラウト':27,'ベッツ':50,'ハーパー':3,'ソト':22,'アクーニャJr.':13,'ダルビッシュ有':11,'千賀滉大':34,'鈴木誠也':27,'吉田正尚':7,'森友哉':10,'宮城大弥':13,'高橋宏斗':19,'伊藤大海':17,'早川隆久':21,'今永昇太':18,'菅野智之':19,'スキーンズ':30,'ゲレーロJr.':27,'タティスJr.':23,'フリーマン':5,'ウィットJr.':7,'ヘンダーソン':2,'スクーバル':29,'山田哲人':1,'筒香嘉智':25,'宮﨑敏郎':51,'浅村栄斗':3,'源田壮亮':6,'森下翔太':1,'中野拓夢':51,'吉川尚輝':2,'丸佳浩':8,'山川穂高':3,'周東佑京':23,'清宮幸太郎':21,'万波中正':66,'岡林勇希':1,'細川成也':55,'村上頌樹':41,'才木浩人':35,'東克樹':11,'森下暢仁':18,'床田寛樹':28,'小園海斗':51,'菊池涼介':33,'有原航平':17,'山﨑福也':18,'小島和哉':14,'隅田知一郎':16,'山下舜平大':12,'松井裕樹':1,'菊池雄星':16,'ヌートバー':21,'金河成':7,'李政厚':51,'フリオ・ロドリゲス':44,'ラッチマン':35,'コービン・キャロル':7,'牧秀悟':2,'スクーバル':29};
const FOREIGN_NAMES=['マルティネス','ジャクソン','オスナ','サンタナ','カリステ','モイネロ','レイエス','ポランコ','ソト','フランコ','セデーニョ','ジャッジ','アクーニャJr.','ベッツ','フリーマン','ハーパー','タティスJr.','ゲレーロJr.','トラウト','スキーンズ','ウィットJr.','ヘンダーソン','スクーバル','ラッチマン','フリオ・ロドリゲス','コービン・キャロル'];
const BEARD_NAMES=['ジャッジ','ハーパー','フリーマン','トラウト','ゲレーロJr.','ポランコ','レイエス','ダルビッシュ有'];

/* スター選手の見た目データ（自作似顔絵の特徴づけ用）: [肌,髪型0短1坊主2長3パーマ4モヒカン5七三6禿,髪色,髭0無1フル2ゴーティー3顎4口髭,眼鏡0無1眼鏡2サングラス,アイブラック,顔幅] */
const STAR_LOOKS={
'大谷翔平':[1,0,'#1c1c1e',0,0,0,1.0],'山本由伸':[1,0,'#1c1c1e',0,0,0,0.98],'佐々木朗希':[1,0,'#1c1c1e',0,0,0,0.96],
'ダルビッシュ有':[2,2,'#241a12',1,0,0,1.02],'千賀滉大':[1,0,'#1c1c1e',3,0,0,1.0],'今永昇太':[1,0,'#1c1c1e',0,1,0,0.98],
'菊池雄星':[1,2,'#1c1c1e',1,0,0,1.0],'松井裕樹':[1,2,'#1c1c1e',0,0,0,0.97],'今井達也':[1,2,'#1c1c1e',0,0,0,0.98],
'戸郷翔征':[1,1,'#1c1c1e',0,0,0,1.0],'森下暢仁':[1,1,'#1c1c1e',0,0,0,1.0],'宮城大弥':[1,0,'#4a2c14',0,0,0,0.98],
'伊藤大海':[1,2,'#2b1c10',0,0,0,0.98],'菅野智之':[1,0,'#1c1c1e',0,0,0,1.0],'村上宗隆':[1,0,'#1c1c1e',0,0,1,1.08],
'岡本和真':[1,1,'#1c1c1e',0,0,0,1.1],'坂本勇人':[1,0,'#5a3a1a',0,0,0,0.98],'山田哲人':[1,0,'#5a3a1a',0,0,0,0.99],
'柳田悠岐':[1,0,'#6a4423',3,0,0,1.0],'近藤健介':[1,0,'#1c1c1e',0,0,0,1.0],'吉田正尚':[1,0,'#1c1c1e',3,0,0,1.02],
'鈴木誠也':[1,0,'#1c1c1e',0,0,1,1.0],'森友哉':[1,1,'#1c1c1e',0,0,0,1.04],'山川穂高':[2,1,'#1c1c1e',0,0,0,1.12],
'清宮幸太郎':[1,2,'#1c1c1e',0,0,0,1.04],'万波中正':[3,0,'#14100c',0,0,0,1.0],'筒香嘉智':[1,1,'#1c1c1e',3,0,0,1.04],
'浅村栄斗':[1,0,'#1c1c1e',3,0,0,1.02],'丸佳浩':[1,1,'#1c1c1e',0,0,0,1.1],'菊池涼介':[1,0,'#5a3a1a',3,0,0,0.98],
'近本光司':[1,0,'#1c1c1e',0,0,0,0.97],'佐藤輝明':[1,0,'#1c1c1e',0,0,0,1.06],'大山悠輔':[1,0,'#1c1c1e',3,0,0,1.04],
'牧秀悟':[1,1,'#1c1c1e',0,0,0,1.02],'周東佑京':[1,0,'#1c1c1e',0,0,0,0.95],'ヌートバー':[2,0,'#5a3a1a',3,0,0,1.0],
'ジャッジ':[2,0,'#14100c',1,0,1,1.06],'トラウト':[1,0,'#3a2410',3,0,0,1.02],'ハーパー':[2,2,'#3a2410',1,0,1,1.0],
'ベッツ':[3,0,'#14100c',2,0,0,0.97],'ソト':[3,0,'#14100c',2,0,0,1.0],'アクーニャJr.':[3,4,'#c9a227',2,0,0,0.98],
'フリーマン':[1,0,'#4a2c14',1,0,0,1.0],'ゲレーロJr.':[3,2,'#14100c',1,0,0,1.06],'タティスJr.':[3,4,'#c9a227',1,0,1,0.98],
'スキーンズ':[1,0,'#3a2410',4,0,0,0.98],'スクーバル':[1,0,'#3a2410',1,0,0,1.0],'ウィットJr.':[3,0,'#14100c',0,0,0,0.97],
'ヘンダーソン':[1,0,'#3a2410',2,0,0,0.99],'ラッチマン':[1,0,'#4a2c14',1,0,0,1.02],'フリオ・ロドリゲス':[3,0,'#14100c',2,0,0,1.0],
'コービン・キャロル':[2,2,'#2b1c10',0,0,0,0.96],'金河成':[1,0,'#6a4423',0,0,0,0.99],'李政厚':[1,5,'#1c1c1e',0,0,0,0.99]
};
function nameHash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
function appearanceOf(p){
  const name=p.name||'選手',h=nameHash(name),foreign=FOREIGN_NAMES.includes(name);
  const sl=STAR_LOOKS[name];
  if(sl)return {skin:sl[0],hairStyle:sl[1],hairColor:sl[2],beardType:sl[3],beard:sl[3]>0,glasses:sl[4],eyeBlack:!!sl[5],faceW:sl[6],capStyle:h%5,number:(p.no||NUMBERS[name]||(h%98)+1)};
  return {skin:foreign?h%5:1+(h%2),hairStyle:h%7,hairColor:foreign?['#2b2b2b','#5a3a1a','#8a6a2f','#c9a227','#3a3a3a'][h%5]:'#1c1c1e',
    beardType:BEARD_NAMES.includes(name)?1:(foreign&&h%3===0)?2:0,beard:BEARD_NAMES.includes(name)||(foreign&&h%3===0),glasses:0,eyeBlack:false,faceW:0.96+(h%9)*0.02,capStyle:h%5,number:(p.no||NUMBERS[name]||(h%98)+1)};
}
const TEAM_COLOR={'巨人':'#e8641c','阪神':'#c9a800','DeNA':'#009ad6','広島':'#e60012','ヤクルト':'#3aa655','中日':'#00418e','ソフトバンク':'#d9a400','日本ハム':'#2a6db0','ロッテ':'#444444','楽天':'#a50034','西武':'#1c4d9e','オリックス':'#243a7a','ドジャース':'#005a9c','カブス':'#0e3386','メッツ':'#ff5910','ヤンキース':'#132448','レッドソックス':'#bd3039','エンゼルス':'#ba0021','パドレス':'#2f241d','ブレーブス':'#ce1141','フィリーズ':'#e81828','ブルージェイズ':'#134a8e','パイレーツ':'#c4a600','ロイヤルズ':'#004687','タイガース':'#0c2340','オリオールズ':'#df4601','マリナーズ':'#005c5c','カージナルス':'#c41e3a','レイズ':'#092c5c','Dバックス':'#a71930','ジャイアンツ(MLB)':'#fd5a1e'};
const SKILLS=['パワーヒッター','安打製造機','韋駄天','守備職人','豪速球','変化球の鬼','鉄腕','勝負強い','神の目','ムードメーカー','サヨナラ男','奪三振王'];
const RARITIES=[['N',45],['R',30],['SR',17],['SSR',6.5],['LEGEND',1.5]];
function rollRarity(){let r=Math.random()*100;for(const [k,w] of RARITIES){if(r<w)return k;r-=w;}return 'N';}
const RAR_RANGE={N:[46,64],R:[58,72],SR:[68,82],SSR:[79,90],LEGEND:[87,99]};

/* ---------- 顔アート生成（自作プロシージャル描画：写真は使わない） ---------- */
const SKIN_TONES=['#ffe0bd','#f2c79b','#e0ac82','#c68863','#8d5524'];
const _portraitCache={};
function drawFaceParts(x,ap,W,H,capColor,teamInit){
  // 顔パーツを描く共通処理（ポートレート用）
  const cx=W/2, cy=H*0.44, rx=W*0.27*(ap.faceW||1), ry=H*0.27, skin=SKIN_TONES[ap.skin];
  x.fillStyle='#8a5a33';x.fillRect(cx-rx*0.32,H*0.66,rx*0.64,H*0.1); // 首
  x.fillStyle=skin;x.beginPath();x.ellipse(cx-rx-2,cy+4,5,H*0.045,0,0,7);x.ellipse(cx+rx+2,cy+4,5,H*0.045,0,0,7);x.fill(); // 耳
  x.fillStyle=skin;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,7);x.fill(); // 顔
  const bc=ap.hairColor==='#c9a227'?'rgba(120,90,20,0.6)':'rgba(40,26,18,0.6)';
  if(ap.beardType===1){x.fillStyle=bc;x.beginPath();x.ellipse(cx,cy+ry*0.52,rx*0.84,ry*0.54,0,0,Math.PI);x.fill();}
  else if(ap.beardType===2){x.fillStyle=bc;x.beginPath();x.ellipse(cx,cy+ry*0.78,rx*0.3,ry*0.22,0,0,7);x.fill();x.fillRect(cx-rx*0.42,cy+ry*0.52,rx*0.84,ry*0.13);}
  else if(ap.beardType===3){x.fillStyle=bc;x.beginPath();x.ellipse(cx,cy+ry*0.55,rx*0.85,ry*0.5,0,0,Math.PI);x.fill();x.fillStyle=skin;x.beginPath();x.ellipse(cx,cy+ry*0.5,rx*0.62,ry*0.4,0,0,Math.PI);x.fill();}
  else if(ap.beardType===4){x.fillStyle=bc;x.fillRect(cx-rx*0.4,cy+ry*0.5,rx*0.8,ry*0.14);}
  if(ap.eyeBlack){x.fillStyle='rgba(15,15,18,0.85)';x.fillRect(cx-rx*0.52,cy+ry*0.06,rx*0.3,ry*0.09);x.fillRect(cx+rx*0.22,cy+ry*0.06,rx*0.3,ry*0.09);}
  // 目・眉
  x.fillStyle='#fff';x.beginPath();x.ellipse(cx-rx*0.38,cy-ry*0.08,rx*0.17,ry*0.09,0,0,7);x.ellipse(cx+rx*0.38,cy-ry*0.08,rx*0.17,ry*0.09,0,0,7);x.fill();
  x.fillStyle='#241a12';x.beginPath();x.ellipse(cx-rx*0.38,cy-ry*0.08,rx*0.08,ry*0.075,0,0,7);x.ellipse(cx+rx*0.38,cy-ry*0.08,rx*0.08,ry*0.075,0,0,7);x.fill();
  x.strokeStyle='#2b2119';x.lineWidth=Math.max(2,W*0.014);x.beginPath();
  x.moveTo(cx-rx*0.56,cy-ry*0.3);x.lineTo(cx-rx*0.2,cy-ry*0.24);x.moveTo(cx+rx*0.56,cy-ry*0.3);x.lineTo(cx+rx*0.2,cy-ry*0.24);x.stroke();
  if(ap.glasses){x.strokeStyle=ap.glasses===2?'#101014':'#333a42';x.lineWidth=Math.max(2.4,W*0.016);
    x.strokeRect(cx-rx*0.58,cy-ry*0.22,rx*0.42,ry*0.3);x.strokeRect(cx+rx*0.16,cy-ry*0.22,rx*0.42,ry*0.3);
    x.beginPath();x.moveTo(cx-rx*0.16,cy-ry*0.1);x.lineTo(cx+rx*0.16,cy-ry*0.1);x.stroke();
    if(ap.glasses===2){x.fillStyle='rgba(10,10,16,0.75)';x.fillRect(cx-rx*0.56,cy-ry*0.2,rx*0.38,ry*0.26);x.fillRect(cx+rx*0.18,cy-ry*0.2,rx*0.38,ry*0.26);}}
  // 鼻・口
  x.strokeStyle='rgba(120,70,40,0.7)';x.lineWidth=Math.max(1.5,W*0.01);x.beginPath();x.moveTo(cx,cy+ry*0.08);x.lineTo(cx-rx*0.08,cy+ry*0.3);x.stroke();
  x.strokeStyle='#7a4636';x.lineWidth=Math.max(2,W*0.016);x.beginPath();x.arc(cx,cy+ry*0.48,rx*0.3,Math.PI*0.15,Math.PI*0.85);x.stroke();
  // 髪 or キャップ
  if(ap.capStyle<3){ // キャップ
    if(ap.hairStyle===2){x.fillStyle=ap.hairColor;x.fillRect(cx-rx*1.02,cy-ry*0.5,rx*0.18,ry*0.85);x.fillRect(cx+rx*0.84,cy-ry*0.5,rx*0.18,ry*0.85);} // 長髪はキャップ下から
    x.fillStyle=capColor;x.beginPath();x.ellipse(cx,cy-ry*0.52,rx*1.04,ry*0.62,0,Math.PI,0);x.fill();
    x.fillRect(cx-rx*1.25,cy-ry*0.6,rx*2.5,ry*0.16); // つば
    x.fillStyle='#fff';x.font='800 '+(W*0.11)+'px sans-serif';x.textAlign='center';x.fillText(teamInit,cx,cy-ry*0.52);
  }else{ // 髪型バリエーション
    x.fillStyle=ap.hairColor;
    if(ap.hairStyle===0){x.beginPath();x.ellipse(cx,cy-ry*0.78,rx*1.02,ry*0.42,0,Math.PI,0);x.fill();}
    else if(ap.hairStyle===1){x.beginPath();x.ellipse(cx,cy-ry*0.88,rx*0.99,ry*0.2,0,Math.PI,0);x.fill();} // 坊主
    else if(ap.hairStyle===2){x.beginPath();x.ellipse(cx,cy-ry*0.7,rx*1.06,ry*0.52,0,Math.PI,0);x.fill();x.fillRect(cx-rx*1.06,cy-ry*0.75,rx*0.2,ry*0.95);x.fillRect(cx+rx*0.86,cy-ry*0.75,rx*0.2,ry*0.95);} // 長髪
    else if(ap.hairStyle===3){for(let i=0;i<9;i++){x.beginPath();x.arc(cx-rx*0.8+i*rx*0.2,cy-ry*0.82+((i%2)*ry*0.1),rx*0.24,0,7);x.fill();}} // パーマ
    else if(ap.hairStyle===4){x.beginPath();x.ellipse(cx,cy-ry*0.8,rx*1.0,ry*0.3,0,Math.PI,0);x.fill();x.fillRect(cx-rx*0.16,cy-ry*1.35,rx*0.32,ry*0.6);} // モヒカン
    else if(ap.hairStyle===5){x.beginPath();x.ellipse(cx,cy-ry*0.8,rx*1.0,ry*0.38,0,Math.PI,0);x.fill();x.fillStyle=skin;x.fillRect(cx-rx*0.95,cy-ry*0.86,rx*0.24,ry*0.16);} // 七三（分け目）
    // 6: スキンヘッド（何も描かない）
  }
}
function drawPortrait(p){
  if(typeof S!=='undefined'&&S&&S.photos&&p.name&&S.photos[p.name])return S.photos[p.name]; // 本人が設定した実写真を最優先
  const key=(p.name||'')+(p.team||'');if(_portraitCache[key])return _portraitCache[key];
  const W=168,H=200,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const ap=appearanceOf(p),tc=TEAM_COLOR[p.team]||'#1858a8';
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,tc);g.addColorStop(1,'#0a1c33');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,0.13)';x.beginPath();x.arc(W/2,H*0.42,W*0.42,0,7);x.fill();
  // ユニフォーム（肩）
  x.fillStyle=tc;x.beginPath();x.moveTo(W*0.08,H);x.lineTo(W*0.3,H*0.72);x.lineTo(W*0.7,H*0.72);x.lineTo(W*0.92,H);x.closePath();x.fill();
  x.fillStyle='#fff';x.fillRect(W*0.47,H*0.74,W*0.06,H*0.26);
  x.fillStyle='#fff';x.font='800 21px sans-serif';x.textAlign='center';x.fillText(ap.number,W/2,H*0.97);
  drawFaceParts(x,ap,W,H,tc,(p.team||'★').charAt(0));
  // レア度フレーム（LEGEND=金、SSR=銀）
  const ovrP=p.kind==='P'?Math.round((p.vel+p.ctl+p.brk+p.sta)/4):Math.round((p.meet+p.pow+p.run+p.def)/4);
  const isLeg=p.rarity==='LEGEND'||(p.real&&ovrP>=88), isSsr=!isLeg&&(p.rarity==='SSR'||(p.real&&ovrP>=82));
  if(isLeg){const lg=x.createLinearGradient(0,0,W,H);lg.addColorStop(0,'#fff3b0');lg.addColorStop(0.5,'#d4af37');lg.addColorStop(1,'#fff3b0');
    x.strokeStyle=lg;x.lineWidth=9;x.strokeRect(4,4,W-8,H-8);
    x.fillStyle='#d4af37';x.fillRect(0,0,W,20);x.fillStyle='#231a00';x.font='800 12.5px sans-serif';x.fillText('★ LEGEND ★',W/2,14.5);}
  else if(isSsr){x.strokeStyle='#cfd8e3';x.lineWidth=6;x.strokeRect(3,3,W-6,H-6);
    x.fillStyle='#cfd8e3';x.fillRect(0,0,W,17);x.fillStyle='#14202e';x.font='800 11px sans-serif';x.fillText('★ SSR ★',W/2,12.5);}
  // 名前帯（長い名前はフォントを縮小してはみ出しを防ぐ）
  x.fillStyle='rgba(4,16,30,0.88)';x.fillRect(0,H-30,W,30);
  const nmTxt=(p.name||'')+'｜'+(p.team||'')+' '+(p.pos||'');
  x.fillStyle='#ffd94d';x.font='800 '+(nmTxt.length>17?10.5:nmTxt.length>13?12:14)+'px sans-serif';x.textAlign='center';
  x.fillText(nmTxt,W/2,H-10);
  const url=cv.toDataURL();_portraitCache[key]=url;return url;
}
function drawFaceTexture(p){
  // 3D頭部前面に貼る顔テクスチャ（本人が写真を設定していればその写真を使う）
  const key='face'+(p.name||'');if(_portraitCache[key])return _portraitCache[key];
  if(typeof S!=='undefined'&&S&&S.photos&&p.name&&S.photos[p.name]){
    const cv=document.createElement('canvas');cv.width=128;cv.height=128;const cx2=cv.getContext('2d');
    cx2.fillStyle='#f2c79b';cx2.fillRect(0,0,128,128);
    const tx=new THREE.CanvasTexture(cv);_portraitCache[key]=tx;
    const img=new Image();img.onload=()=>{const s=Math.max(128/img.width,128/img.height);cx2.drawImage(img,(128-img.width*s)/2,(128-img.height*s)/2,img.width*s,img.height*s);tx.needsUpdate=true;};img.src=S.photos[p.name];
    return tx;
  }
  const W=128,H=128,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const ap=appearanceOf(p);
  const cx=64,cy=66,rx=40,ry=44;
  x.fillStyle='#fff';x.beginPath();x.ellipse(cx-rx*0.38,cy-6,7,4.4,0,0,7);x.ellipse(cx+rx*0.38,cy-6,7,4.4,0,0,7);x.fill();
  x.fillStyle='#241a12';x.beginPath();x.ellipse(cx-rx*0.38,cy-6,3.4,3.6,0,0,7);x.ellipse(cx+rx*0.38,cy-6,3.4,3.6,0,0,7);x.fill();
  x.strokeStyle='#2b2119';x.lineWidth=3;x.beginPath();x.moveTo(cx-22,cy-17);x.lineTo(cx-8,cy-14);x.moveTo(cx+22,cy-17);x.lineTo(cx+8,cy-14);x.stroke();
  x.strokeStyle='rgba(120,70,40,0.8)';x.lineWidth=2;x.beginPath();x.moveTo(cx,cy+6);x.lineTo(cx-3,cy+15);x.stroke();
  x.strokeStyle='#7a4636';x.lineWidth=2.6;x.beginPath();x.arc(cx,cy+18,12,Math.PI*0.15,Math.PI*0.85);x.stroke();
  if(ap.beardType===1){x.fillStyle='rgba(40,26,18,0.5)';x.beginPath();x.ellipse(cx,cy+26,34,21,0,0,Math.PI);x.fill();}
  else if(ap.beardType===2){x.fillStyle='rgba(40,26,18,0.55)';x.beginPath();x.ellipse(cx,cy+38,12,8,0,0,7);x.fill();x.fillRect(cx-17,cy+24,34,5);}
  else if(ap.beardType===4){x.fillStyle='rgba(40,26,18,0.6)';x.fillRect(cx-16,cy+24,32,5);}
  if(ap.eyeBlack){x.fillStyle='rgba(15,15,18,0.85)';x.fillRect(cx-24,cy+2,13,4);x.fillRect(cx+11,cy+2,13,4);}
  const tx=new THREE.CanvasTexture(cv);_portraitCache[key]=tx;return tx;
}
let uidC=1;
function genPlayer(kind,rarity,scale){
  rarity=rarity||rollRarity(); const [lo,hi]=RAR_RANGE[rarity];
  const g=()=>clamp(Math.round(rf(lo,hi)+(scale||0)),20,99);
  const p={id:uidC++,name:pick(SURNAMES)+' '+pick(FIRSTNAMES),age:ri(18,32),kind,rarity,
    meet:g(),pow:g(),run:g(),def:g(),vel:g(),ctl:g(),brk:g(),sta:g(),
    lv:1,exp:0,potential:pick(['S','A','A','B','B','C']),skill:null,
    ss:{ab:0,h:0,hr:0,rbi:0,sb:0,ip:0,k:0,er:0,w:0},retired:false};
  if(Math.random()<0.3||rarity==='SSR'||rarity==='LEGEND') p.skill=pick(SKILLS);
  if(rarity==='LEGEND'){p.age=ri(19,26);p.potential='S';}
  p.pos= kind==='P'? '投手' : pick(['捕手','一塁','二塁','三塁','遊撃','左翼','中堅','右翼']);
  return p;
}
function overall(p){return p.kind==='P'?Math.round((p.vel+p.ctl+p.brk+p.sta)/4):Math.round((p.meet+p.pow+p.run+p.def)/4);}

/* ---------- セーブデータ ---------- */
const SAVE_KEY='dreamPennant3D_v1';
let S=null;
function newSave(){
  uidC=1;
  const players=[];
  for(let i=0;i<11;i++) players.push(genPlayer('B', i===0?'SR':(i<3?'R':'N')));
  for(let i=0;i<5;i++) players.push(genPlayer('P', i===0?'SR':(i<2?'R':'N')));
  // 主人公：最初から少し強い「あなた」枠
  players[0].name='小林 タツ'; players[0].skill='サヨナラ男';
  const st={year:1,gameNo:1,phase:'season',coins:600,tp:20,fans:1500,stadiumLv:1,
    players,standings:null,career:{wins:0,losses:0,draws:0,titles:0,japan:0,seasons:0,hits:0,hr:0,ks:0,games:0},
    hof:[],ach:[],missions:null,lastIdle:Date.now(),news:['球団創設！ ドリームスターズの長い物語が始まる。'],rival:'山本由伸',hrRace:null,settings:{se:1,crowd:1,mute:false},tutoDone:false,scoutPity:0,
    playoff:null,champYear:[],photos:{}};
  st.standings=freshStandings();
  return st;
}
function freshStandings(){
  const t=[{name:'ドリームスターズ',w:0,l:0,d:0}];
  CPU_TEAMS.forEach(c=>t.push({name:c.name,w:0,l:0,d:0}));
  return t;
}
function save(){try{S.lastSave=Date.now();if(S.news&&S.news.length>30)S.news=S.news.slice(0,30);localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}} // ニュースは最新30件にキャップ（セーブ肥大防止）
function load(){
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw){S=JSON.parse(raw);
    // セーブ修復：古い/壊れたセーブでも落ちないよう、欠けた中核フィールドを既定値で補う（キーは dreamPennant3D_v1 のまま）
    if(!S||typeof S!=='object')throw new Error('bad save');
    if(!Array.isArray(S.players)||!S.players.length)S.players=newSave().players;
    S.players.forEach(p=>{if(!p.ss)p.ss={ab:0,h:0,hr:0,rbi:0,sb:0,ip:0,k:0,er:0,w:0};
      ['ab','h','hr','rbi','sb','ip','k','er','w'].forEach(k=>{if(!(p.ss[k]>=0))p.ss[k]=0;});
      if(p.lv==null||!(p.lv>=1))p.lv=1;if(p.exp==null||!(p.exp>=0))p.exp=0;
      // 年齢・調子・故障・能力値の欠損/NaNを補完（欠けたままだと年越し処理で年齢がNaN化し引退判定が壊れる）
      if(!(p.age>=15&&p.age<=60))p.age=25;
      if(p.form==null||isNaN(p.form))p.form=0; else p.form=clamp(p.form,-2,2);
      if(p.inj==null||isNaN(p.inj)||p.inj<0)p.inj=0;
      ['meet','pow','run','def','vel','ctl','brk','sta'].forEach(k=>{if(!(p[k]>=0))p[k]=50;});
      if(!p.pos)p.pos=p.kind==='P'?'投手':'控え';
      if(!p.potential)p.potential='B';
      if(!p.kind)p.kind='B';
      if(!p.rarity)p.rarity='N';
    });
    if(!['season','cs','js','draft'].includes(S.phase))S.phase='season';
    if(S.campYear==null)S.campYear=0;if(S.tradeYear==null)S.tradeYear=0;
    if(S.hrRace!=null&&!Array.isArray(S.hrRace))S.hrRace=null;
    // 開幕前（第1戦・全チーム未勝利）なのに本塁打王レースに本数が入っている旧セーブは0本へ戻す
    if(Array.isArray(S.hrRace)&&S.gameNo===1&&Array.isArray(S.standings)&&S.standings.every(t=>!(t.w>0)&&!(t.l>0)&&!(t.d>0)))S.hrRace.forEach(r=>{r.hr=0;});
    if(S.missions!=null&&(!S.missions||!Array.isArray(S.missions.list)))S.missions=null;
    if(!Array.isArray(S.standings)||S.standings.length!==6)S.standings=freshStandings();
    if(!S.career)S.career={wins:0,losses:0,draws:0,titles:0,japan:0,seasons:0,hits:0,hr:0,ks:0,games:0};
    if(S.coins==null)S.coins=600;if(S.tp==null)S.tp=20;if(S.fans==null)S.fans=1500;
    // 数値フィールドの異常値（文字列/NaN/負数/球場Lv範囲外）も修復する（壊れたセーブでHUD表示や球場名が壊れるのを防ぐ）
    ['coins','tp','fans'].forEach(k=>{if(!(S[k]>=0)||!isFinite(S[k]))S[k]=k==='fans'?1500:k==='tp'?20:600;});
    if(!(S.gameNo>=1)||!isFinite(S.gameNo))S.gameNo=1;if(!(S.year>=1)||!isFinite(S.year))S.year=1;
    S.stadiumLv=clamp(Math.round(S.stadiumLv)||1,1,10);
    if(!S.stadiumLv)S.stadiumLv=1;if(!S.phase)S.phase='season';if(!S.gameNo)S.gameNo=1;if(!S.year)S.year=1;
    if(!Array.isArray(S.news))S.news=['球団創設！ ドリームスターズの長い物語が始まる。'];
    if(!Array.isArray(S.hof))S.hof=[];if(!Array.isArray(S.ach))S.ach=[];if(!Array.isArray(S.champYear))S.champYear=[];
    if(!S.lastIdle)S.lastIdle=Date.now();
    uidC=1000+S.players.reduce((m,p)=>Math.max(m,p.id||0),0)+ri(1,50);
    if(!S.photos)S.photos={};if(!S.settings)S.settings={se:1,crowd:1,mute:false};if(S.scoutPity==null)S.scoutPity=0;
    if(!(S.settings.se>=0&&S.settings.se<=1))S.settings.se=1;if(!(S.settings.crowd>=0&&S.settings.crowd<=1))S.settings.crowd=1;
    if(!S.v2){ // v2移行：順位表のチーム名を実在チームへ差し替え（勝敗は引き継ぐ）
      if(S.standings)CPU_TEAMS.forEach((t,i)=>{if(S.standings[i+1])S.standings[i+1].name=t.name;});
      S.v2=1;setTimeout(()=>save(),500);
    }
    return true;}}catch(e){}
  S=newSave();S.v2=1;save();return false;
}

/* ---------- 効果音（WebAudio合成・自作） ---------- */
let AC=null;
function volMul(){if(!S||!S.settings)return 1;return S.settings.mute?0:(S.settings.se==null?1:S.settings.se);}
function crowdMul(){if(!S||!S.settings)return 1;return S.settings.mute?0:(S.settings.crowd==null?1:S.settings.crowd);}
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,d,type,g,slide){const c=ac();if(!c)return;const o=c.createOscillator(),v=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(slide,c.currentTime+d);v.gain.setValueAtTime((g||0.12)*volMul(),c.currentTime);v.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d);o.connect(v).connect(c.destination);o.start();o.stop(c.currentTime+d);}
function noiseBurst(d,g,fq){const c=ac();if(!c)return;const len=c.sampleRate*d,buf=c.createBuffer(1,len,c.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);const src=c.createBufferSource();src.buffer=buf;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=fq||1200;const v=c.createGain();v.gain.value=(g||0.2)*volMul();src.connect(f).connect(v).connect(c.destination);src.start();}
function sfx(n){
  if(n==='bat'){noiseBurst(0.08,0.5,2500);tone(180,0.08,'square',0.15,60);}
  else if(n==='crack'){noiseBurst(0.05,0.7,3400);tone(150,0.06,'square',0.22,50);setTimeout(()=>noiseBurst(0.09,0.3,900),30);}
  else if(n==='hit'){tone(660,0.12,'sine',0.15);setTimeout(()=>tone(880,0.15,'sine',0.15),70);}
  else if(n==='hr'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'triangle',0.18),i*90));noiseBurst(0.7,0.12,800);}
  else if(n==='cheer'){noiseBurst(0.6,0.16,900);}
  else if(n==='whiff'){noiseBurst(0.15,0.2,500);}
  else if(n==='catch'){tone(240,0.07,'sine',0.2,120);}
  else if(n==='coin'){tone(1320,0.07,'square',0.08);setTimeout(()=>tone(1760,0.12,'square',0.08),60);}
  else if(n==='ui'){noiseBurst(0.06,0.10,1800);}
  else if(n==='fanfare'){[392,523,659,784,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.24,'triangle',0.17),i*110));}
  else if(n==='charge'){[523,523,523,659,784,659].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'square',0.07),i*120));}
  else if(n==='metal'){tone(2400,0.16,'triangle',0.12,1800);tone(3200,0.1,'sine',0.08);}
  else if(n==='level'){[440,554,659,880].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'triangle',0.16),i*80));}
  else if(n==='out'){tone(196,0.2,'sawtooth',0.1,98);}
  else if(n==='gacha'){[392,494,587,784,988].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'triangle',0.14),i*70));}
}
/* --- Androidネイティブ連携（アプリならでは） --- */
function vib(pat){try{if(window.NativeApp&&NativeApp.vibrate)NativeApp.vibrate(pat);else if(navigator.vibrate)navigator.vibrate(pat.split(',').map(Number));}catch(e){}}
function nativeShare(text){try{if(window.NativeApp&&NativeApp.share){NativeApp.share(text);return;}}catch(e){}
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('結果をコピーした！'));}
window.onNativeBack=function(){ // 本体の戻るボタン：パネル→モーダル→ゲーム画面の順に閉じる
  if(!$('screen-panel').classList.contains('hidden')){closePanel();sfx('ui');return true;}
  if(!$('modal').classList.contains('hidden')){closeModal();return true;}
  return false;};
function shareResult(){if(!M)return;const t='⚾ドリームペナント3D 結果⚾\n'+S.year+'年目 '+M.label+'\nドリームスターズ '+M.score.me+' - '+M.score.cpu+' '+M.opp.name+'\n本塁打'+M.teamHr+'本 / 安打'+M.teamHits+'本 / 奪三振'+M.teamK+'\n#ドリームペナント3D';nativeShare(t);}
function popupN(txt,color){const d=document.createElement('div');d.className='popup-n';d.textContent=txt;if(color)d.style.color=color;
  d.style.left=(38+Math.random()*24)+'%';d.style.top='30%';document.body.appendChild(d);setTimeout(()=>d.remove(),1300);}
function flash(){const f=$('flash');f.style.opacity=0.85;setTimeout(()=>f.style.opacity=0,130);}
function toast(msg,ms){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(t._h);const dur=ms||clamp(2400+Math.max(0,msg.length-18)*110,2400,8000);t._h=setTimeout(()=>t.classList.add('hidden'),dur);} // 長いメッセージ（キャンプ結果等）は文字数に応じて表示時間を延ばす
function banner(msg,ms){const b=$('big-banner');b.textContent=msg;b.classList.remove('hidden');b.style.animation='none';void b.offsetWidth;b.style.animation='';clearTimeout(b._h);b._h=setTimeout(()=>b.classList.add('hidden'),ms||1700);}
let modalCb=null;
function modal(title,html,cb){sfx('ui');$('modal-title').innerHTML=title;$('modal-body').innerHTML=html;$('modal').classList.remove('hidden');modalCb=cb||null;}
function closeModal(){$('modal').classList.add('hidden');if(modalCb){const c=modalCb;modalCb=null;c();}}

/* ---------- ミッション ---------- */
const MISSION_POOL=[
 {key:'win',label:'試合に1勝する',target:1,reward:150},
 {key:'hit',label:'ヒットを5本打つ',target:5,reward:120},
 {key:'hr',label:'ホームランを1本打つ',target:1,reward:150},
 {key:'k',label:'三振を3つ奪う',target:3,reward:120},
 {key:'run',label:'1試合で3点以上取る',target:1,reward:130},
 {key:'train',label:'特訓を1回する',target:1,reward:80},
 {key:'scout',label:'スカウトを1回引く',target:1,reward:100},
 {key:'play',label:'試合を2試合する',target:2,reward:140},
];
function ensureMissions(){
  const tk=todayKey();
  if(!S.missions||S.missions.date!==tk){
    const seed=[...tk].reduce((a,c)=>a+c.charCodeAt(0),0);
    const pool=MISSION_POOL.slice();const list=[];
    for(let i=0;i<3;i++){list.push(Object.assign({},pool[(seed+i*3)%pool.length],{prog:0,claimed:false}));}
    S.missions={date:tk,list};save();
  }
}
function missionAdd(key,n){
  if(!S.missions)return;let changed=false;
  S.missions.list.forEach(m=>{if(m.key===key&&!m.claimed){const before=m.prog;m.prog=Math.min(m.target,m.prog+n);changed=true;
    if(before<m.target&&m.prog>=m.target&&!m._notified){m._notified=true;try{if(window.NativeApp)NativeApp.notifyNow('🎯 ミッション達成！','「'+m.label+'」達成！ 報酬'+m.reward+'コインを受け取ろう');}catch(e){}}}});
  if(changed)save();
}

/* ---------- 実績 ---------- */
const ACHS=[
 {id:'w1',label:'初勝利',cond:()=>S.career.wins>=1,reward:100},
 {id:'w50',label:'通算50勝',cond:()=>S.career.wins>=50,reward:500},
 {id:'w200',label:'通算200勝（球団の誇り）',cond:()=>S.career.wins>=200,reward:2000},
 {id:'h100',label:'チーム通算100安打',cond:()=>S.career.hits>=100,reward:300},
 {id:'hr50',label:'チーム通算50本塁打',cond:()=>S.career.hr>=50,reward:500},
 {id:'k300',label:'チーム通算300奪三振',cond:()=>S.career.ks>=300,reward:500},
 {id:'t1',label:'リーグ優勝',cond:()=>S.career.titles>=1,reward:800},
 {id:'j1',label:'日本一',cond:()=>S.career.japan>=1,reward:1500},
 {id:'j5',label:'日本一 5回（黄金時代）',cond:()=>S.career.japan>=5,reward:5000},
 {id:'s10',label:'球団10年目に到達',cond:()=>S.year>=10,reward:1000},
 {id:'s30',label:'球団30年目（もはや歴史）',cond:()=>S.year>=30,reward:3000},
 {id:'st10',label:'球場を最大まで拡張',cond:()=>S.stadiumLv>=10,reward:1000},
];
function checkAch(){
  ACHS.forEach(a=>{if(!S.ach.includes(a.id)&&a.cond()){S.ach.push(a.id);S.coins+=a.reward;toast('🏅 実績「'+a.label+'」達成！ +'+a.reward+'コイン');sfx('level');}});
}
const ACH_PROG={'w1':[()=>S.career.wins,1],'w50':[()=>S.career.wins,50],'w200':[()=>S.career.wins,200],'h100':[()=>S.career.hits,100],'hr50':[()=>S.career.hr,50],'k300':[()=>S.career.ks,300],'t1':[()=>S.career.titles,1],'j1':[()=>S.career.japan,1],'j5':[()=>S.career.japan,5],'s10':[()=>S.year,10],'s30':[()=>S.year,30],'st10':[()=>S.stadiumLv,10]}; // 未達成実績の進捗（現在値取得関数と目標値）

/* ============================================================
   3D球場（Three.js / 全て自作プリミティブ構築）
   座標: ホーム z=+16, マウンド z=0, 外野 z=-方向
   ============================================================ */
let renderer,scene,camera,ballMesh,stadiumGroup,boardCanvas,boardCtx,boardTex;
let P3={fielders:[],runners:[null,null,null]};
let camMode='hub',camAngle=0,ballTrail=[];
let camManualMode=null,camManualUntil=0; // 手動カメラ切替の固定（20秒間、演出の follow だけは割り込み可）
const tweens=[];let slowmo=1,speedMul=1;
let freezeT=0,slowT=0,shakeAmp=0,fovPunch=0; // 打撃演出：ヒットストップ・打球スロー・シェイク・FOVパンチ
function addTween(dur,fn,done,ease){tweens.push({t:0,dur,fn,done,ease:ease||(x=>x)});}
function stepTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){const tw=tweens[i];tw.t+=dt*slowmo*speedMul*(freezeT>0?0.06:1)*(slowT>0?0.45:1);const p=clamp(tw.t/tw.dur,0,1);tw.fn(tw.ease(p));if(p>=1){tweens.splice(i,1);if(tw.done)tw.done();}}
}
function mat(c,r){return new THREE.MeshLambertMaterial({color:c,roughness:r==null?0.9:r});}
/* --- テクスチャ生成（全て自作プロシージャル） ---
   静的テクスチャはメモ化する：buildStadium はイニング交代・継投のたびに呼ばれるため、
   毎回 CanvasTexture を作り直すと GPU メモリを食い続けてしまう */
const _texCache={};
function cachedTex(key,make){if(_texCache[key])return _texCache[key];const t=make();_texCache[key]=t;return t;}
function makeGrassTex(){return cachedTex('grass',()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
  x.fillStyle='#37a24b';x.fillRect(0,0,256,256);
  x.fillStyle='rgba(255,255,255,0.055)';x.fillRect(0,0,128,256);
  for(let i=0;i<2600;i++){x.fillStyle=Math.random()<0.5?'rgba(0,60,0,0.13)':'rgba(190,255,190,0.10)';x.fillRect(Math.random()*256,Math.random()*256,2,2);}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,7);return t;
});}
function makeNoiseTex(base,speck){return cachedTex('noise'+base+'_'+speck,()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');
  x.fillStyle=base;x.fillRect(0,0,128,128);x.fillStyle=speck;
  for(let i=0;i<900;i++){x.globalAlpha=Math.random()*0.25;x.fillRect(Math.random()*128,Math.random()*128,2,2);}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);return t;
});}
function makeSkyTex(night){return cachedTex(night?'skyNight':'skyDay',()=>{
  const cv=document.createElement('canvas');cv.width=64;cv.height=256;const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);
  if(night){g.addColorStop(0,'#060f24');g.addColorStop(0.6,'#10294d');g.addColorStop(1,'#274b73');}
  else{g.addColorStop(0,'#3f8fd2');g.addColorStop(0.6,'#7ab8e8');g.addColorStop(1,'#cfe9fa');}
  x.fillStyle=g;x.fillRect(0,0,64,256);
  if(night){x.fillStyle='#fff';for(let i=0;i<70;i++){x.globalAlpha=Math.random()*0.9;x.fillRect(Math.random()*64,Math.random()*150,1.6,1.6);}}
  return new THREE.CanvasTexture(cv);
});}
function makeWindowTex(){return cachedTex('window',()=>{
  const cv=document.createElement('canvas');cv.width=64;cv.height=128;const x=cv.getContext('2d');
  x.fillStyle='#232c3c';x.fillRect(0,0,64,128);
  for(let r=0;r<10;r++)for(let c=0;c<5;c++){x.fillStyle=Math.random()<0.45?'rgba(255,214,120,0.95)':'rgba(140,170,210,0.35)';x.fillRect(6+c*12,8+r*12,7,7);}
  return new THREE.CanvasTexture(cv);
});}
function makeGlowTex(){return cachedTex('glow',()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,62);g.addColorStop(0,'rgba(255,246,200,1)');g.addColorStop(0.4,'rgba(255,240,180,0.45)');g.addColorStop(1,'rgba(255,240,180,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(cv);
});}
function makeBallTex(){return cachedTex('ball',()=>{
  const cv=document.createElement('canvas');cv.width=128;cv.height=64;const x=cv.getContext('2d');
  x.fillStyle='#fdfdf8';x.fillRect(0,0,128,64);
  x.strokeStyle='#d63b3b';x.lineWidth=2.4;x.setLineDash([4,3]);
  x.beginPath();x.arc(32,32,26,0,7);x.stroke();x.beginPath();x.arc(96,32,26,0,7);x.stroke();
  return new THREE.CanvasTexture(cv);
});}
function makeDomeTex(){return cachedTex('dome',()=>{
  const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');
  x.fillStyle='#e8ecf0';x.fillRect(0,0,256,128);
  x.strokeStyle='rgba(90,110,130,0.55)';x.lineWidth=2;
  for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,128);x.stroke();}
  for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*32);x.lineTo(256,i*32);x.stroke();}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,2);return t;
});}
function makeSignTex(txt){return cachedTex('sign'+txt,()=>{
  const cv=document.createElement('canvas');cv.width=96;cv.height=64;const x=cv.getContext('2d');
  x.fillStyle='#f4f6f8';x.fillRect(0,0,96,64);x.fillStyle='#12304f';x.font='800 34px sans-serif';x.textAlign='center';x.fillText(txt,48,42);
  x.font='800 15px sans-serif';x.fillText('m',78,58);
  return new THREE.CanvasTexture(cv);
});}
let crowdMeshes=[];
function box(w,h,d,c,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);(parent||scene).add(m);return m;}
function cyl(rt,rb,h,c,x,y,z,parent,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12),mat(c));m.position.set(x,y,z);(parent||scene).add(m);return m;}

const _jerseyCache={};
function jerseyTexture(color,number){
  const key=color+'_'+number;if(_jerseyCache[key])return _jerseyCache[key];
  const cv=document.createElement('canvas');cv.width=128;cv.height=128;const x=cv.getContext('2d');
  x.fillStyle='#'+color.toString(16).padStart(6,'0');x.fillRect(0,0,128,128);
  x.fillStyle='rgba(255,255,255,0.16)';for(let i=0;i<5;i++)x.fillRect(12+i*26,0,3,128); // ピンストライプ風
  x.fillStyle='#ffffff';x.fillRect(58,0,12,128); // 前立て
  x.font='800 62px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='rgba(0,0,0,0.45)';
  x.strokeText(number,64,88);x.fillText(number,64,88);
  const t=new THREE.CanvasTexture(cv);_jerseyCache[key]=t;return t;
}
/* ===== 外部3Dモデル（選手：Quaternius CC0／球場："Ballpark" by Poly by Google, CC-BY 3.0, via Poly Pizza） ===== */
const EXT={players:{},stadium:null,ready:false,failed:false};
function preloadExtModels(){
  if(!window.THREE||!THREE.GLTFLoader){EXT.failed=true;return;}
  const loader=new THREE.GLTFLoader();
  const keys=['casual','farmer','worker','adventurer'];let pending=keys.length+1;
  const done=()=>{if(--pending<=0){EXT.ready=true;if(scene&&(!M||M.finished))buildStadium();}}; // 読み込み完了後にホーム画面の球場も差し替える
  keys.forEach(k=>{loader.load('models/player-'+k+'.glb',g=>{EXT.players[k]={scene:g.scene,animations:g.animations};done();},undefined,()=>{done();});});
  loader.load('models/ballpark-a.glb',g=>{EXT.stadium=g.scene;done();},undefined,()=>{done();});
}
function glbPlay(g,name,once){
  const u=g.userData,acts=u.acts;if(!acts)return;
  const a=acts[name]||acts.Idle;if(!a)return;
  if(once){a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.fadeIn(0.05);a.play();u.onceUntil=performance.now()/1000+a.getClip().duration*0.92;if(u.curAct&&u.curAct!==a)u.curAct.fadeOut(0.08);u.curAct=a;return;}
  if(u.curAct===a)return;
  a.reset();a.setLoop(THREE.LoopRepeat,Infinity);a.fadeIn(0.15);a.play();
  if(u.curAct)u.curAct.fadeOut(0.15);
  u.curAct=a;
}
function glbUpdate(g,dt){
  const u=g.userData;if(!u.mixer)return;
  if(u.inMotion)return; // 投球モーション中はボーンを手動制御するためミキサーを止める
  u.mixer.update(dt);
  if(performance.now()/1000<(u.onceUntil||0))return;
  glbPlay(g,u.running?'Run':'Idle');
}
function makePlayer(color,accent,isBatter,person){
  person=person||{name:'選手'+ri(1,999)};
  if(EXT.ready){const g=makePlayerGLB(color,accent,isBatter,person);if(g)return g;}
  return makePlayerPrimitive(color,accent,isBatter,person);
}
function makePlayerGLB(color,accent,isBatter,person){
  const keys=Object.keys(EXT.players);if(!keys.length)return null;
  const ap=appearanceOf(person);
  const key=keys[Math.abs(nameHash(person.name||''))%keys.length];
  const tpl=EXT.players[key];
  let root;
  try{root=THREE.SkeletonUtils.clone(tpl.scene);}catch(e){return null;}
  const g=new THREE.Group();g.add(root);
  const bb=new THREE.Box3().setFromObject(root);const h=bb.max.y-bb.min.y;
  if(h>0.1){const s=1.9/h;root.scale.setScalar(s);root.position.y-=bb.min.y*s;}
  const skinCol=new THREE.Color(SKIN_TONES[ap.skin]),hairCol=new THREE.Color(ap.hairColor);
  root.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.frustumCulled=false;
    if(/Backpack/i.test(o.name)){o.visible=false;return;}
    const wasArr=Array.isArray(o.material);const mats=wasArr?o.material:[o.material];const nm=o.name;
    const out=mats.map(m=>{const c=m.clone();const mn=c.name||'';
      if(mn==='Skin')c.color.copy(skinCol);
      else if(mn==='Skin_Darker'){c.color.copy(skinCol);c.color.multiplyScalar(0.82);}
      else if(mn==='Hair'||mn==='Moustache'||mn==='Eyebrows')c.color.copy(hairCol);
      else if(mn==='Eye'||mn==='Red'){}
      else if(/Head/.test(nm))c.color.set(color);        // 帽子・ヘルメット等の頭パーツはチーム色
      else if(/Legs|Pants/.test(nm))c.color.set(0xf4f6f8); // ズボンは白（ユニフォーム化）
      else if(/Feet/.test(nm))c.color.set(0x23252b);       // スパイクは黒
      else if(/Body/.test(nm))c.color.set(color);          // 上半身＝ジャージ色
      return c;});
    o.material=wasArr?out:out[0];
  });
  const headBone=root.getObjectByName('Head');
  const wristR=root.getObjectByName('WristR'),wristL=root.getObjectByName('WristL'); // ※threeのGLTFLoaderはボーン名の「.」を除去する
  // ※ボーンのワールドスケールは約100（Blenderのcm変換）なので、装着物は逆スケールで打ち消す
  root.updateMatrixWorld(true);
  function attach(bone,mesh,x,y,z){if(!bone)return mesh;const sv=new THREE.Vector3();bone.getWorldScale(sv);const k=sv.x||1;mesh.scale.multiplyScalar(1/k);mesh.position.set(x/k,y/k,z/k);bone.add(mesh);return mesh;}
  function attachMesh(bone,geo,material,x,y,z){const m=new THREE.Mesh(geo,material);return attach(bone,m,x,y,z);}
  const hasHat=(key==='farmer'||key==='worker'); // この2モデルは元々帽子を被っている（チーム色に染まる）ので二重に被せない
  if(headBone){ // 帽子・ヘルメット・似せ要素を頭ボーンへ（頭ボーン原点は首元、頭の中心は約+0.10上）
    if(isBatter&&!hasHat)attachMesh(headBone,new THREE.SphereGeometry(0.17,14,10,0,Math.PI*2,0,Math.PI*0.5),mat(accent),0,0.115,0);
    else if(!isBatter&&ap.capStyle<3&&!hasHat){attachMesh(headBone,new THREE.SphereGeometry(0.165,14,10,0,Math.PI*2,0,Math.PI*0.5),mat(color),0,0.115,0);attachMesh(headBone,new THREE.BoxGeometry(0.19,0.025,0.13),mat(color),0,0.11,0.135);}
    if(ap.hairStyle===4&&ap.capStyle>=3&&!isBatter&&!hasHat)attachMesh(headBone,new THREE.BoxGeometry(0.04,0.1,0.18),mat(parseInt(ap.hairColor.slice(1),16)),0,0.20,0); // モヒカン
    if(ap.beardType===1||ap.beardType===2)attachMesh(headBone,new THREE.PlaneGeometry(0.13,0.075),new THREE.MeshBasicMaterial({color:0x2a1c10,transparent:true,opacity:0.75}),0,0.035,0.10);
    if(ap.glasses&&!isBatter)attachMesh(headBone,new THREE.BoxGeometry(0.19,0.028,0.016),mat(0x14161c),0,0.105,0.10); // 眼鏡
  }
  if(isBatter&&wristR){const bat=attachMesh(wristR,new THREE.CylinderGeometry(0.02,0.028,0.86,8),mat(0x9c6b30),0,0.1,0.05);bat.rotation.x=1.2;g.userData.bat=bat;}
  if(!isBatter&&wristL){const glove=attachMesh(wristL,new THREE.BoxGeometry(0.15,0.17,0.07),mat(0x8a5a2a),0,-0.03,0.03);glove.rotation.x=0.4;}
  const mixer=new THREE.AnimationMixer(root);const acts={};
  (tpl.animations||[]).forEach(a=>{acts[a.name.split('|').pop()]=mixer.clipAction(a);});
  g.userData.glb=true;g.userData.mixer=mixer;g.userData.acts=acts;g.userData.curAct=null;g.userData.onceUntil=0;
  if(!isBatter){ // 投球モーション等が使うボーン（打者は構え揺れと競合するため付けない）
    g.userData.armR=root.getObjectByName('UpperArmR');g.userData.armL=root.getObjectByName('UpperArmL');
    g.userData.legL=root.getObjectByName('UpperLegL');g.userData.shinL=root.getObjectByName('LowerLegL');
  }
  g.userData.person=person;
  glbPlay(g,'Idle');
  allPlayers3D.push(g);
  return g;
}
function makePlayerPrimitive(color,accent,isBatter,person){
  // リアル寄り人体モデル（自作）：脚ピボット・腕ピボット・顔テクスチャ・背番号ジャージ
  person=person||{name:'選手'+ri(1,999)};
  const ap=appearanceOf(person), skin=parseInt(SKIN_TONES[ap.skin].slice(1),16);
  const g=new THREE.Group();
  // 脚（股関節ピボットで走りアニメ可能に）
  function leg(side){ // 2関節の脚：太もも＋膝ピボット＋すね（走ると膝が曲がる）
    const piv=new THREE.Group();piv.position.set(0.11*side,0.70,0);g.add(piv);
    box(0.145,0.36,0.155,0xf4f6f8,0,-0.17,0,piv); // 太もも
    const knee=new THREE.Group();knee.position.set(0,-0.35,0);piv.add(knee);
    box(0.125,0.32,0.13,0xf4f6f8,0,-0.15,0,knee); // すね
    box(0.15,0.055,0.165,accent,0,-0.05,0,knee); // ストッキングのライン
    box(0.135,0.07,0.27,0x22242a,0,-0.315,0.045,knee); // スパイク
    piv.userData.shin=knee;
    return piv;
  }
  const legL=leg(-1),legR=leg(1);
  // 胴（ジャージ：背番号テクスチャ）
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.24,0.64,14),new THREE.MeshLambertMaterial({map:jerseyTexture(color,ap.number)}));
  torso.position.set(0,1.0,0);g.add(torso);
  box(0.34,0.1,0.2,0xf4f6f8,0,0.70,0,g); // 腰
  box(0.35,0.035,0.21,0x2a2d33,0,0.755,0,g); // ベルト
  // 腕（肩ピボット）
  function arm(side,isBatArm){
    const piv=new THREE.Group();piv.position.set(0.29*side,1.28,0);g.add(piv);
    box(0.12,0.3,0.12,color,0,-0.13,0,piv); // 袖
    box(0.125,0.05,0.125,accent,0,-0.275,0,piv); // 袖口のライン
    box(0.10,0.3,0.10,skin,0,-0.4,0,piv);   // 前腕・肌
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8),mat(skin));hand.position.set(0,-0.56,0);piv.add(hand);
    piv.rotation.z=side*0.16;
    return piv;
  }
  const armL=arm(-1),armR=arm(1);
  if(!isBatter){const glove=box(0.17,0.19,0.08,0x8a5a2a,0,-0.58,0.03,armL);glove.rotation.x=0.4;} // グラブ
  // 頭（顔テクスチャ＋髪/キャップ/ヘルメット）
  const headG=new THREE.Group();headG.position.set(0,1.52,0);g.add(headG);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.165,16,14),mat(skin));head.scale.set(0.92,1.08,0.98);headG.add(head);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(0.27,0.27),new THREE.MeshBasicMaterial({map:drawFaceTexture(person),transparent:true}));
  face.position.set(0,-0.01,0.152);headG.add(face);
  if(isBatter){ // バッティングヘルメット
    const helm=new THREE.Mesh(new THREE.SphereGeometry(0.185,14,10,0,Math.PI*2,0,Math.PI*0.55),mat(accent));helm.position.y=0.03;headG.add(helm);
    box(0.16,0.12,0.03,accent,-0.14,-0.03,0.1,headG); // 耳当て
  }else if(ap.capStyle<3){
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.175,14,10,0,Math.PI*2,0,Math.PI*0.5),mat(color));cap.position.y=0.025;headG.add(cap);
    box(0.24,0.03,0.16,color,0,0.03,0.2,headG); // つば
  }else{
    const hair=new THREE.Mesh(new THREE.SphereGeometry(0.172,14,10,0,Math.PI*2,0,Math.PI*0.45),mat(parseInt(ap.hairColor.slice(1),16)));hair.position.y=0.03;headG.add(hair);
  }
  // 3Dの似せ要素：モヒカン/長髪/髭/眼鏡
  const hairCol3=parseInt(ap.hairColor.slice(1),16);
  if(ap.hairStyle===4&&ap.capStyle>=3&&!isBatter)box(0.05,0.12,0.22,hairCol3,0,0.22,0,headG); // モヒカン
  if(ap.hairStyle===2)box(0.26,0.3,0.06,hairCol3,0,-0.06,-0.15,headG); // 長髪（後ろ）
  if(ap.beardType===1||ap.beardType===2){const bd=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.1),new THREE.MeshBasicMaterial({color:0x2a1c10,transparent:true,opacity:0.75}));bd.position.set(0,-0.105,0.148);headG.add(bd);}
  if(ap.glasses&&!isBatter)box(0.24,0.035,0.02,0x14161c,0,0.01,0.155,headG); // 眼鏡
  if(isBatter){
    const bat=cyl(0.024,0.034,0.86,0x9c6b30,0,-0.62,0.12,armR);bat.rotation.x=1.15;
    armR.rotation.z=-0.5;armR.rotation.x=-0.7;armL.rotation.x=-0.5;
    g.userData.bat=bat;
  }
  g.scale.setScalar(1.12);
  g.traverse(o=>{if(o.isMesh&&!(o.material&&o.material.isMeshBasicMaterial))o.castShadow=true;});
  g.userData.armL=armL;g.userData.armR=armR;g.userData.legL=legL;g.userData.legR=legR;g.userData.shinL=legL.userData.shin;g.userData.shinR=legR.userData.shin;g.userData.head=headG;g.userData.person=person;
  allPlayers3D.push(g);
  return g;
}
let allPlayers3D=[];
const BASE_POS={pitcher:[0,0,0],catcher:[0,0,18.2],'1B':[10.5,0,5.5],'2B':[5.5,0,-4.5],SS:[-5.5,0,-4.5],'3B':[-10.5,0,5.5],LF:[-17,0,-19],CF:[0,0,-24],RF:[17,0,-19],batter:[1.15,0,16.2],onDeck:[-2.6,0,17.5]};

function buildStadium(){
  if(stadiumGroup){scene.remove(stadiumGroup);}
  stadiumGroup=new THREE.Group();scene.add(stadiumGroup);
  const lv=S.stadiumLv, night=S._night||false;
  const useExt=!!(EXT.ready&&EXT.stadium); // 外部球場モデル（Ballpark）が使える時はスタンド等を置き換える
  scene.background=makeSkyTex(night);
  crowdMeshes=[];
  if(useExt){const bp=EXT.stadium.clone();bp.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});bp.rotation.y=Math.PI/2;bp.scale.set(2.34,2.0,2.0);bp.position.set(0,-2.16,-5.3);stadiumGroup.add(bp);} // ※モデルのフィールド面は自前y=1.07にあるため、その面が自フィールドの少し下(y≈-0.02)に来るよう沈める
  // グラウンド（芝テクスチャ）
  const gtex=makeGrassTex();gtex.center.set(0.5,0.5);gtex.rotation=((S.gameNo||1)%2)*Math.PI/2;
  const grass=new THREE.Mesh(new THREE.CircleGeometry(46,40),new THREE.MeshLambertMaterial({map:gtex,color:night?0x8fa88f:0xffffff}));grass.rotation.x=-Math.PI/2;grass.position.z=-4;grass.receiveShadow=true;stadiumGroup.add(grass);
  // 球場の外の街並みと雲（周りの景色）
  const winTex=makeWindowTex();
  for(let i=0;i<26;i++){const a=(i/26)*Math.PI*2+rf(-0.06,0.06);const r=rf(76,102);const h=rf(9,30),w=rf(9,17);
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshLambertMaterial({map:winTex,color:night?0x8a97ad:0xb9c6d6}));
    b.position.set(Math.sin(a)*r,h/2-1,-4+Math.cos(a)*r);stadiumGroup.add(b);}
  const glowTexC=makeGlowTex();
  for(let i=0;i<5;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexC,color:0xffffff,transparent:true,opacity:night?0.25:0.75,depthWrite:false}));
    sp.position.set(rf(-70,70),rf(30,44),rf(-80,-30));sp.scale.set(rf(20,30),rf(6,9),1);stadiumGroup.add(sp);}
  // 福岡タワー（三角柱）と博多湾の海（ドームの名物景色）
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(2.0,4.4,54,3),new THREE.MeshLambertMaterial({map:winTex,color:0xaebfd4}));
  tower.position.set(60,26,-74);stadiumGroup.add(tower);
  cyl(0.12,0.3,9,0x8a97ad,60,56,-74,stadiumGroup,6);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(280,64),mat(0x2a6db0));sea.rotation.x=-Math.PI/2;sea.position.set(0,-0.18,-98);stadiumGroup.add(sea);
  // 芝のストライプ（外野に縦帯・自作）
  for(let i=-2;i<=2;i++){const s=box(9.4,0.02,27,i%2?0x2f9445:0x3cab54,i*9.5,0.012,-19,stadiumGroup);}
  // 内野：みずほPayPayドーム式の人工芝（内野も芝、土は塁周りのピットだけ）
  const dirtTex=makeNoiseTex('#b5804a','#8a5a2a');
  const turfTex=makeNoiseTex('#2f9e4f','#257a3c');
  const dirt=new THREE.Mesh(new THREE.CircleGeometry(13.5,4),new THREE.MeshLambertMaterial({map:turfTex}));dirt.rotation.x=-Math.PI/2;dirt.rotation.z=Math.PI/4;dirt.position.set(0,0.02,5.5);dirt.scale.set(1,1.25,1);dirt.receiveShadow=true;stadiumGroup.add(dirt);
  [[11,5],[0,-6],[-11,5]].forEach(b=>{const pit=new THREE.Mesh(new THREE.CircleGeometry(1.35,16),new THREE.MeshLambertMaterial({map:dirtTex}));pit.rotation.x=-Math.PI/2;pit.position.set(b[0],0.028,b[1]);pit.receiveShadow=true;stadiumGroup.add(pit);});
  const homeDirt=new THREE.Mesh(new THREE.CircleGeometry(2.2,20),new THREE.MeshLambertMaterial({map:dirtTex}));homeDirt.rotation.x=-Math.PI/2;homeDirt.position.set(0,0.03,16.4);homeDirt.receiveShadow=true;stadiumGroup.add(homeDirt);
  const mound=cyl(1.6,1.7,0.25,0xc08a52,0,0.05,0,stadiumGroup,20);mound.material=new THREE.MeshLambertMaterial({map:dirtTex}); // マウンド
  // 塁
  [[11,5],[0,-6],[-11,5]].forEach(b=>box(0.55,0.09,0.55,0xffffff,b[0],0.06,b[1],stadiumGroup));
  box(0.7,0.06,0.5,0xffffff,0,0.05,16.4,stadiumGroup); // ホーム
  // ファウルライン
  const lineMat=mat(0xffffff);
  [[1,0],[-1,0]].forEach(s=>{const l=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.02,34),lineMat);l.position.set(s[0]*8.2,0.03,0.5);l.rotation.y=s[0]*0.245;stadiumGroup.add(l);});
  // 外野フェンス（広告色）: ホームを中心に外野方向へ円弧配置（外部球場の時はその壁を使う）
  const fenceCols=[0x1858a8,0xe8722a,0x1858a8,0x2e9e4f,0x1858a8,0xd63b3b,0x1858a8];
  for(let i=0;i<(useExt?0:15);i++){const a=-1.12+i*0.16;const fx=Math.sin(a)*34, fz=-4-Math.cos(a)*34;
    const f=box(7.4,1.5+(lv>=6?0.7:0),0.3,fenceCols[i%fenceCols.length],fx,0.8,fz,stadiumGroup);f.rotation.y=a;
    if(i%5===2){const distTxt=i<5?'100':i<10?'122':'100';const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.25),new THREE.MeshBasicMaterial({map:makeSignTex(distTxt)}));
      sign.position.set(Math.sin(a)*33.6,1.75,-4-Math.cos(a)*33.6);sign.rotation.y=a+Math.PI;stadiumGroup.add(sign);}}
  // LEDリボンビジョン（流れる応援メッセージ）
  if(!useExt){const rt=cachedTex('ribbon',()=>{const rc=document.createElement('canvas');rc.width=1024;rc.height=36;const rx2=rc.getContext('2d');
   rx2.fillStyle='#0a1430';rx2.fillRect(0,0,1024,36);rx2.fillStyle='#ffd94d';rx2.font='800 24px sans-serif';rx2.textAlign='left';
   rx2.fillText('★ HAWKS ★ ドリームスターズ がんばれ！ ★ みずほPayPayドーム ★ 若鷹軍団 ★',10,26);
   const t2=new THREE.CanvasTexture(rc);t2.wrapS=THREE.RepeatWrapping;return t2;});window._ribbonTex=rt;
   for(let i=0;i<5;i++){const a=-0.9+i*0.45;const rp=new THREE.Mesh(new THREE.PlaneGeometry(15,0.85),new THREE.MeshBasicMaterial({map:rt}));
     rp.position.set(Math.sin(a)*36.8,3.1,-4-Math.cos(a)*36.8);rp.rotation.y=a+Math.PI;stadiumGroup.add(rp);}}
  // ホームランテラス（PayPayドーム名物：左右中間の低い柵＋黄色い手すり）
  if(!useExt)[-0.84,0.84].forEach(c=>{for(let i=0;i<4;i++){const a=c+(i-1.5)*0.088;
    const f=box(3.3,0.85,0.25,0x24403a,Math.sin(a)*30.6,0.45,-4-Math.cos(a)*30.6,stadiumGroup);f.rotation.y=a;
    const rail=cyl(0.05,0.05,3.3,0xf7c500,Math.sin(a)*30.6,0.98,-4-Math.cos(a)*30.6,stadiumGroup,6);rail.rotation.z=Math.PI/2;rail.rotation.y=-a;}});
  // スタンド（Lvで大きく育つ）: 外野円弧に段々で配置（外部球場の時はモデル側のスタンドを使う）
  const tiers=useExt?0:clamp(1+Math.floor(lv/2),1,6);
  for(let t=0;t<tiers;t++){
    const r=39+t*3.4, h=1.1+t*2.2;
    for(let i=0;i<15;i++){const a=-1.12+i*0.16;
      const seat=box(r*0.168+0.8,2.4,3.9,t%2?0x7e97b8:0x9db4d6,Math.sin(a)*r,h,-4-Math.cos(a)*r,stadiumGroup);seat.rotation.y=a;}
    // 観客ドット（最上段）
    if(t===tiers-1){for(let i=0;i<46+lv*9;i++){const a=rf(-1.12,1.12);const rr=r+rf(-0.7,0.7);
      const dot=box(0.34,0.4,0.34,pick([0xffd94d,0xffffff,0xff8a8a,0x8ac8ff,0xffe0b3]),Math.sin(a)*rr,h+1.25,-4-Math.cos(a)*rr,stadiumGroup);dot.userData.y0=h+1.25;crowdMeshes.push(dot);}}
  }
  // バックネット裏スタンド（ホーム後方）
  if(!useExt){for(let t=0;t<clamp(1+Math.floor(lv/3),1,4);t++){box(30,2,2,0x6d88aa,0,1+t*2.1,28+t*2.6,stadiumGroup);}
  for(let i=0;i<20+lv*4;i++){const dot=box(0.34,0.4,0.34,pick([0xffd94d,0xffffff,0xff8a8a,0x8ac8ff]),rf(-14,14),2.2+Math.floor(lv/3)*2.1,27.4,stadiumGroup);dot.userData.y0=dot.position.y;crowdMeshes.push(dot);}}
  if(night&&lv>=2&&!useExt){const vg=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex(),color:0xffe9a0,transparent:true,opacity:0.30,depthWrite:false}));vg.position.set(0,6.4,-39.5);vg.scale.set(30,13,1);stadiumGroup.add(vg);}
  // 照明塔（Lv3〜、夜は点灯）
  if(lv>=3&&!useExt){[[-30,-26],[30,-26],[-32,16],[32,16]].forEach(p=>{
    cyl(0.25,0.35,13,0x555f6e,p[0],6.5,p[1],stadiumGroup,8);
    box(3.4,1.8,0.4,0x333c48,p[0],13.4,p[1],stadiumGroup);
    if(night){const sm=new THREE.MeshBasicMaterial({color:0xfff6c8});for(let ix=-1;ix<=1;ix++)for(let iy=0;iy<2;iy++){const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),sm);bulb.position.set(p[0]+ix*1.1,13.1+iy*0.7,p[1]);stadiumGroup.add(bulb);}
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex(),transparent:true,opacity:0.85,depthWrite:false}));glow.position.set(p[0],13.4,p[1]);glow.scale.set(11,7,1);stadiumGroup.add(glow);}
  });}
  // ホークスビジョン（大型ビジョン：黄枠＋黒画面）※外部球場の時はモデル側のボード位置（左中間）に合わせる
  if(lv>=2){
    const bw=useExt?10.5:(lv>=4?17:12), bh=useExt?4.6:(lv>=4?7:5);
    const bx=useExt?-3.9:0, by=useExt?8.8:6.4, bz=useExt?-34.2:-38.7, bry=0;
    const frame=box(bw+(useExt?2.2:1),bh+(useExt?3.2:1),0.5,0xf7c500,bx,by,bz,stadiumGroup);frame.rotation.y=bry;
    const back=box(bw+(useExt?1.2:0),bh+(useExt?2.2:0),0.55,0x0a0a0c,bx,by,bz,stadiumGroup);back.rotation.y=bry;
    boardCanvas=document.createElement('canvas');boardCanvas.width=640;boardCanvas.height=256;boardCtx=boardCanvas.getContext('2d');
    boardTex=new THREE.CanvasTexture(boardCanvas);
    const bp=new THREE.Mesh(new THREE.PlaneGeometry(bw-0.5,bh-0.5),new THREE.MeshBasicMaterial({map:boardTex}));
    bp.position.set(bx-Math.sin(bry)*-0.3,by,bz+Math.cos(bry)*0.3);bp.rotation.y=bry;stadiumGroup.add(bp);drawBoard(useExt?'ドリームペナント3D':'みずほPayPayドーム','HAWKS VISION');
  }
  // みずほPayPayドームの開閉式屋根（Lv3〜）：昼はオープン、夜はクローズ＋天井照明
  if(lv>=3&&!useExt){
    const open=!night;
    const geo=open?new THREE.SphereGeometry(56,26,10,0,Math.PI*2,0,Math.PI/4.4):new THREE.SphereGeometry(56,26,12,0,Math.PI*2,0,Math.PI/2.1);
    const dome=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:makeDomeTex(),transparent:true,opacity:open?0.55:0.45,side:THREE.DoubleSide,depthWrite:false}));
    dome.position.set(0,open?7:0,open?-20:-4);stadiumGroup.add(dome);
    for(let i=0;i<3;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(52,0.24,6,36,Math.PI),mat(0xc3ccd4));
      rib.position.set(0,0.5,-4);rib.rotation.y=i*Math.PI/3;stadiumGroup.add(rib);}
    if(night){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const lamp=box(1.4,0.3,0.6,0xfff2b0,Math.cos(a)*26,24,-4+Math.sin(a)*26,stadiumGroup);}}
  }
  // ウォーニングトラック＆ファウルポール＆ダッグアウト＆バックネット（実在感の追加）
  const wt=new THREE.Mesh(new THREE.RingGeometry(33.2,37.6,40),mat(0xa8743f));wt.rotation.x=-Math.PI/2;wt.position.set(0,0.015,-4);stadiumGroup.add(wt);
  if(!useExt)[-1.12,1.12].forEach(a=>{const px=Math.sin(a)*34,pz=-4-Math.cos(a)*34;cyl(0.09,0.09,7.5,0xffd21f,px,3.75,pz,stadiumGroup,8);box(0.7,0.5,0.06,0xffd21f,px+(a<0?-0.4:0.4),6.8,pz,stadiumGroup);});
  box(2,0.7,7,0x46685a,18.5,0.35,11,stadiumGroup);box(2,0.7,7,0x46685a,-18.5,0.35,11,stadiumGroup);
  const net=new THREE.Mesh(new THREE.PlaneGeometry(13,3.6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.16,side:THREE.DoubleSide}));net.position.set(0,1.8,21.5);stadiumGroup.add(net);
  // ダグアウトの控え選手とブルペン（脇役の生活感）
  // buildStadium が短時間に連続で呼ばれても控え選手が二重生成されないようトークンで世代管理する
  const benchGen=(window._benchGen=(window._benchGen||0)+1);
  setTimeout(()=>{ if(!scene||window._benchGen!==benchGen)return;
    [-18.5,18.5].forEach((dx,side)=>{for(let i=0;i<3;i++){const bp2=makePlayer(side===0?0x1858e0:((M&&M.oppDef)?M.oppDef.color:0xd63b3b),0x333333,false,{name:'控え'+i});bp2.scale.setScalar(0.95);bp2.position.set(dx,0.1,8.5+i*2.2);bp2.rotation.y=side===0?Math.PI/2:-Math.PI/2;scene.add(bp2);(P3.bench=P3.bench||[]).push(bp2);}});
    if(!useExt)[-29,29].forEach(bx=>{cyl(1.3,1.4,0.22,0xc08a52,bx,0.03,-26,stadiumGroup,14);const bp3=makePlayer(0x1858e0,0x1858e0,false,{name:'ブルペン投手'});bp3.position.set(bx,0.2,-26);scene.add(bp3);(P3.bench=P3.bench||[]).push(bp3);});
  },50);
  // 選手配置
  P3.fielders.forEach(f=>scene.remove(f));P3.fielders=[];(P3.bench||[]).forEach(f=>scene.remove(f));P3.bench=[];
  if(P3.batter)scene.remove(P3.batter);
  allPlayers3D=[];
  const myCol=0x1858e0, cpuCol=(M&&M.oppDef)?M.oppDef.color:0xd63b3b;
  const defCol = (M&&M.half==='top')? myCol: cpuCol; // 守備側の色
  const posList=['pitcher','catcher','1B','2B','SS','3B','LF','CF','RF'];
  posList.forEach((pos,i)=>{const person=pos==='pitcher'&&M?(M.half==='top'?M.starter:M.opp.pitcher):{name:pos+(M&&M.half!=='top'?(M.oppDef?M.oppDef.short:'相手'):'自軍'),team:M&&M.half!=='top'?(M.oppDef?M.oppDef.realTeam:''):''};
    const pm=makePlayer(defCol,defCol,false,person);pm.userData.isFielder=true;const bp=BASE_POS[pos];pm.position.set(bp[0],bp[1],bp[2]);if(pos==='pitcher')pm.position.y=0.22;pm.userData.home=new THREE.Vector3(bp[0],pos==='pitcher'?0.22:bp[1],bp[2]);if(pos==='catcher'){pm.scale.y=0.8;pm.position.y=-0.14;pm.userData.home.y=-0.14;}pm.lookAt(0,0,16);scene.add(pm);P3.fielders.push(pm);if(pos==='pitcher')P3.pitcher=pm;if(pos==='catcher')P3.catcher=pm;});
  const batCol=(M&&M.half==='top')? cpuCol: myCol;
  const batPerson=M?(M.half==='top'?curCpuBatter():curMyBatter()):{name:'打者'};
  P3.batter=makePlayer(batCol,batCol,true,batPerson);P3.batter.position.set(BASE_POS.batter[0],BASE_POS.batter[1],BASE_POS.batter[2]);P3.batter.rotation.y=Math.PI;scene.add(P3.batter);
  // ストライクゾーン枠と捕手のミット目標（投球中だけ表示）
  const zf=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15,1.2,0.06)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.4}));
  zf.position.set(0,1.22,16.35);zf.visible=false;scene.add(zf);P3.zoneFrame=zf;
  const tr=new THREE.Mesh(new THREE.RingGeometry(0.13,0.19,20),new THREE.MeshBasicMaterial({color:0xffd94d,transparent:true,opacity:0.55,side:THREE.DoubleSide}));
  tr.position.set(0,1.2,16.3);tr.visible=false;scene.add(tr);P3.targetRing=tr;
  // 球審と次打者（実在感）
  const ump=makePlayer(0x232a36,0x232a36,false,{name:'球審'});ump.position.set(-0.4,0,19.4);ump.rotation.y=Math.PI;scene.add(ump);P3.ump=ump;
  const deck=makePlayer(batCol,batCol,true,M?(M.half==='top'?M.opp.batters[(M.ci+1)%9]:M.lineup[(M.li+1)%M.lineup.length]):{name:'次打者'});
  deck.position.set(BASE_POS.onDeck[0],0,BASE_POS.onDeck[2]);deck.rotation.y=Math.PI*0.8;scene.add(deck);
  updateRunners3D();
  if(ballMesh)scene.remove(ballMesh);
  ballMesh=new THREE.Mesh(new THREE.SphereGeometry(0.145,12,10),new THREE.MeshLambertMaterial({map:makeBallTex()}));ballMesh.castShadow=true;ballMesh.position.set(0,1.3,0);ballMesh.visible=false;scene.add(ballMesh);
}
function drawBoard(l1,l2){
  if(!boardCtx)return;const c=boardCtx,W=boardCanvas.width,H=boardCanvas.height;
  c.fillStyle='#0a0a0c';c.fillRect(0,0,W,H);
  c.fillStyle='#f7c500';c.fillRect(0,0,W,44);
  c.fillStyle='#111';c.font='800 27px sans-serif';c.textAlign='center';c.fillText('⚾ HAWKS VISION ⚾',W/2,32);
  c.fillStyle='#ffd94d';c.font='800 '+(l1.length>10?44:56)+'px sans-serif';c.fillText(l1,W/2,128);
  c.fillStyle='#ffffff';c.font='800 38px sans-serif';c.fillText(l2,W/2,196);
  c.fillStyle='#f7c500';c.fillRect(0,H-14,W,14);
  if(boardTex)boardTex.needsUpdate=true;
}
function updateRunners3D(){
  P3.runners.forEach(r=>{if(r){scene.remove(r);allPlayers3D=allPlayers3D.filter(g=>g!==r);}});P3.runners=[null,null,null]; // 配列からも除去（リーク防止）
  if(!M)return;
  const col=(M.half==='top')?((M.oppDef)?M.oppDef.color:0xd63b3b):0x1858e0;
  const pos=[[11,5],[0,-6],[-11,5]];
  M.bases.forEach((b,i)=>{if(b){const person=(M.half==='bottom'&&typeof b==='number')?(S.players.find(p=>p.id===b)||{name:'走者'}):{name:'走者'+i+(M.oppDef?M.oppDef.short:''),team:M.oppDef?M.oppDef.realTeam:''};
    const pm=makePlayer(col,col,false,person);pm.userData.running=true;pm.position.set(pos[i][0]-0.5,0,pos[i][1]+0.5);scene.add(pm);P3.runners[i]=pm;}});
}
function setCam(mode){if(camManualMode&&performance.now()<camManualUntil&&mode!==camManualMode&&mode!=='follow')return;camMode=mode;}
function updateCamera(dt){
  camAngle+=dt*(S._fireworksSpin?0.05:0.12);
  if(window._ribbonTex)window._ribbonTex.offset.x-=dt*0.04;
  if(camMode==='hub'){const r=34;camera.position.set(Math.sin(camAngle)*r,15,6+Math.cos(camAngle)*r);camera.lookAt(0,1,-2);}
  else if(camMode==='bat'){camera.position.set(1.8,2.6,23.5);camera.lookAt(0,1.1,-4);}
  else if(camMode==='pitch'){camera.position.set(3.4,3.2,-7.5);camera.lookAt(0,1.1,15);}
  else if(camMode==='outfield'){camera.position.set(0,20,-34);camera.lookAt(0,0,10);}
  else if(camMode==='follow'&&ballMesh){camera.position.lerp(new THREE.Vector3(ballMesh.position.x*0.7,7,ballMesh.position.z+13),0.12);camera.lookAt(ballMesh.position);}
  if(shakeAmp>0.003){camera.position.x+=rf(-1,1)*shakeAmp;camera.position.y+=rf(-1,1)*shakeAmp*0.7;}
  const nf=55-fovPunch*8;if(Math.abs(camera.fov-nf)>0.05){camera.fov=nf;camera.updateProjectionMatrix();}
}
let ballTrailLine=null,trailPts=[];
function updateTrail(){ // 打球トレイル：頭が明るく尾が消えるグラデーション（加算合成）
  if(!ballTrailLine)return;const n=trailPts.length,posA=ballTrailLine.geometry.attributes.position,colA=ballTrailLine.geometry.attributes.color;
  for(let i=0;i<26;i++){const p=trailPts[Math.min(i,Math.max(0,n-1))];if(p){posA.setXYZ(i,p.x,p.y,p.z);}const f=n>1?Math.pow(i/(n-1),1.7):0;colA.setXYZ(i,f,f,f);}
  ballTrailLine.geometry.setDrawRange(0,n);posA.needsUpdate=true;colA.needsUpdate=true;}
function initGL(){
  const cv=$('gl');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.Fog(0x9fc8e8,70,150);
  camera=new THREE.PerspectiveCamera(55,1,0.1,320);
  const light=new THREE.DirectionalLight(0xffffff,1.05);light.position.set(24,38,16);
  light.castShadow=true;light.shadow.mapSize.set(2048,2048);
  light.shadow.camera.left=-46;light.shadow.camera.right=46;light.shadow.camera.top=46;light.shadow.camera.bottom=-46;light.shadow.camera.far=110;light.shadow.bias=-0.0006;
  scene.add(light);scene.userData.sun=light;
  scene.add(new THREE.HemisphereLight(0xcfe8ff,0x3a6b35,0.5));
  scene.add(new THREE.AmbientLight(0xffffff,0.32));
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(26*3),3));tg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(26*3),3));
  ballTrailLine=new THREE.Line(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false}));
  ballTrailLine.frustumCulled=false;scene.add(ballTrailLine);
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  let last=performance.now(),frameAcc=0,frameN=0,qualityChecked=false;
  (function loop(now){requestAnimationFrame(loop);const dt=Math.min(0.05,(now-last)/1000);last=now;stepTweens(dt);if(freezeT>0)freezeT-=dt;if(slowT>0)slowT-=dt;if(shakeAmp>0)shakeAmp=Math.max(0,shakeAmp-dt*1.5);if(fovPunch>0)fovPunch=Math.max(0,fovPunch-dt*3.0);tickMeter(now);
    frameAcc+=dt;frameN++;
    if(!qualityChecked&&frameN>240){qualityChecked=true;if(frameAcc/frameN>0.045){renderer.shadowMap.enabled=false;if(scene.userData.sun)scene.userData.sun.castShadow=false;}} // 低速端末は影を切って軽く
    if(ballMesh){if(ballMesh.visible){trailPts.push(ballMesh.position.clone());if(trailPts.length>26)trailPts.shift();updateTrail();}
      else if(trailPts.length){trailPts=[];updateTrail();}}
    const t=now*0.001;
    for(let i=0;i<allPlayers3D.length;i++){const g=allPlayers3D[i];if(!g.parent)continue;const u=g.userData;
      if(u.glb){glbUpdate(g,dt);continue;} // 外部モデルはアニメーションクリップで動かす
      if(u.running&&u.legL){const ph=t*13+i*2.1,s=Math.sin(ph);u.legL.rotation.x=s*0.6;u.legR.rotation.x=-s*0.6;u.armL.rotation.x=-s*0.35;u.armR.rotation.x=s*0.35;
        if(u.shinL){u.shinL.rotation.x=-Math.max(0,Math.sin(ph-0.8))*0.95;u.shinR.rotation.x=-Math.max(0,-Math.sin(ph-0.8))*0.95;}} // 膝の屈曲
      else if(u.isFielder&&u.armL){u.armL.rotation.x=Math.sin(t*1.7+i*1.9)*0.06;}
      if(u.head)u.head.position.y=1.52+Math.sin(t*1.8+i*1.37)*0.011; // 呼吸：頭と体がわずかに上下する
      if(!u.running&&!u.inMotion)g.position.y=Math.sin(t*1.8+i*1.37)*0.008;}
    if(crowdMeshes.length&&performance.now()>(window._crowdHold||0)){const ct=now*0.001;for(let ci=0;ci<crowdMeshes.length;ci++){const d=crowdMeshes[ci];d.position.y=d.userData.y0+Math.sin(ct*2.1+ci*0.55)*0.045;}} // 観客のざわめき
    if(P3.batter&&P3.batter.userData.armR&&M&&!M.finished&&!M.ballLive)P3.batter.userData.armR.rotation.z=-0.5+Math.sin(t*3.1)*0.08; // バットの揺れ（構え）
    updateCamera(dt);renderer.render(scene,camera);})(last);
}

/* ============================================================
   ホーム画面・パネル群
   ============================================================ */
const STADIUM_NAMES=['草野球場','町営球場','みずほPayPayドーム（仮）','みずほPayPayドーム（屋根つき）','みずほPayPayドーム','みずほPayPayドーム（HC付き）','みずほPayPayドーム（満員仕様）','みずほPayPayドーム（完全体）','みずほPayPayドーム（聖地）','みずほPayPayドーム'];
function stadiumCost(lv){return lv*lv*260+lv*300;}
function idleRatePerMin(){return S.stadiumLv*3+Math.floor(S.fans/600)+S.players.filter(p=>p.rarity==='SSR'||p.rarity==='LEGEND').length*2;}
function idleAmount(){const mins=(Date.now()-S.lastIdle)/60000;return Math.floor(Math.min(mins,480)*idleRatePerMin());}
function myRank(){
  const arr=S.standings.map((t,i)=>({i,w:t.w,l:t.l,d:t.d,rate:t.w+t.l? t.w/(t.w+t.l):0})).sort((a,b)=>b.rate-a.rate||b.w-a.w);
  return arr.findIndex(x=>x.i===0)+1;
}
function nextMatchLabel(){
  if(S.phase==='cs')return '🔥 クライマックス ファイナル！';
  if(S.phase==='js')return '👑 日本シリーズ 一発勝負！';
  if(S.phase==='draft')return '🌱 新シーズン準備（ドラフト）';
  const opp=CPU_TEAMS[(S.gameNo-1)%CPU_TEAMS.length];
  return '第'+S.gameNo+'戦 vs '+opp.name;
}
function refreshHUD(){
  $('hud-coins').textContent=fmt(S.coins);$('hud-tp').textContent=fmt(S.tp);$('hud-fans').textContent=fmt(S.fans);
  $('hud-season').textContent=S.year+'年目　'+(S.phase==='season'?('シーズン第'+S.gameNo+'戦 / 24'):S.phase==='cs'?'クライマックス':S.phase==='js'?'日本シリーズ':'オフシーズン')+'　順位:'+myRank()+'位';
  $('hud-team').textContent='⚾ ドリームスターズ（'+S.year+'年目）';
  $('home-record-line').textContent='通算 '+S.career.wins+'勝'+S.career.losses+'敗 / リーグ優勝 '+S.career.titles+'回 / 日本一 '+S.career.japan+'回 / 球場Lv'+S.stadiumLv+' '+STADIUM_NAMES[S.stadiumLv-1]+' / 殿堂 '+S.hof.length+'人';
  const stadSub=$('stadium-sub');if(stadSub)stadSub.textContent='Lv'+S.stadiumLv+' '+STADIUM_NAMES[S.stadiumLv-1];
  $('play-sub').textContent=nextMatchLabel();
  $('idle-amount').textContent=fmt(idleAmount())+' コイン（毎分'+idleRatePerMin()+'）';
  const idleBtn=$('btn-idle');if(idleBtn)idleBtn.disabled=idleAmount()<=0; // 貯まっていない時は受け取るボタンを押せない見た目にする
  $('home-news').innerHTML=S.news&&S.news.length?S.news.slice(0,3).map(n=>'📰 '+n).join('<br>'):'📰'; // ニュースは最新3件まで表示
  // ミッション進捗をホームでも見えるように（受取可能な報酬の見落とし防止）
  if(S.missions&&S.missions.list){
    const claimable=S.missions.list.filter(m=>!m.claimed&&m.prog>=m.target).length;
    const done=S.missions.list.filter(m=>m.claimed).length;
    const ms=$('missions-sub');if(ms)ms.textContent='毎日3つ（'+done+'/3受取済'+(claimable?'・🎁'+claimable+'件受取可！':'')+'）';
    if(claimable)$('home-news').innerHTML+='<br>🎯 受け取れるミッション報酬が'+claimable+'件あるよ！';
  }
}
function showHome(){
  $('hud-season').style.visibility='visible';
  $('screen-game').classList.add('hidden');$('screen-panel').classList.add('hidden');$('screen-home').classList.remove('hidden');
  setCam('hub');buildStadium();refreshHUD();
  if(S._fireworks){S._fireworks=false;S._fireworksSpin=true;setTimeout(launchFireworks,500);setTimeout(()=>{S._fireworksSpin=false;},9000);} // 勝利の花火（PayPayドーム名物）
}
function openPanel(title,html){$('panel-title').innerHTML=title;$('panel-body').innerHTML=html;$('screen-panel').classList.remove('hidden');}
function closePanel(){$('screen-panel').classList.add('hidden');}
function avgText(p){ // 打率表記：10割は「1.000」、それ以外は「.312」形式（旧実装は10割で「.1000」になっていた）
  if(!p.ss||!p.ss.ab)return '---';
  const a=p.ss.h/p.ss.ab;
  return a>=1?'1.000':'.'+String(Math.round(a*1000)).padStart(3,'0');
}
function eraText(p){ // 防御率表記：投球回0は「--」
  if(!p.ss||!p.ss.ip)return '--';
  return (p.ss.er*9/Math.max(1,p.ss.ip/3)).toFixed(2);
}
function statHtml(p){
  if(p.kind==='P')return '球速'+p.vel+' 制球'+p.ctl+' 変化'+p.brk+' 体力'+p.sta;
  return 'ミート'+p.meet+' パワー'+p.pow+' 走'+p.run+' 守'+p.def;
}
function statBarsHtml(p){ // 能力値をバー表示（.statbar 活用）
  const bar=(lb,v)=>lb+' <span class="statbar"><i style="width:'+clamp(v,0,100)+'%"></i></span> '+v;
  if(p.kind==='P')return bar('球速',p.vel)+' '+bar('制球',p.ctl)+'<br>'+bar('変化',p.brk)+' '+bar('体力',p.sta);
  return bar('ミート',p.meet)+' '+bar('パワー',p.pow)+'<br>'+bar('走力',p.run)+' '+bar('守備',p.def);
}
function playerCard(p,extra){
  return '<div class="card"><img class="portrait" src="'+drawPortrait(p&&p.team?p:Object.assign({},p,{team:'スターズ'}))+'"><span class="nm rarity-'+p.rarity+'">['+p.rarity+'] '+p.name+'</span>'+(p.real?' <span class="small">🌟実在選手（'+p.team+'）</span>':'')+' <span class="small">'+((p.inj>0)?'🩹故障中（あと'+p.inj+'試合） ':'')+((p.form>=2)?'🔥絶好調 ':'')+((p.form<=-2)?'❄絶不調 ':'')+((p.age>=37)?'⚠引退間近 ':'')+p.age+'歳 '+p.pos+' Lv'+p.lv+' 総合'+overall(p)+(p.skill?' / 特技:'+p.skill:'')+' / 将来性'+p.potential+' / 次Lvまであと'+Math.max(0,p.lv*30-(p.exp||0))+'exp</span><br>'+
  '<span class="small">'+statBarsHtml(p)+'</span><br><span class="small">今季: '+(p.kind==='P'?('防御率相当 '+eraText(p)+' 奪三振'+p.ss.k+' 投球回'+(p.ss.ip/3).toFixed(1)):('打率 '+avgText(p)+' 本'+p.ss.hr+' 打点'+p.ss.rbi+' 安打'+p.ss.h+' 盗塁'+(p.ss.sb||0)))+'</span><div class="flexrow" style="margin-top:5px">'+(extra||'')+'<button class="btn mini" onclick="setPlayerPhoto(\''+p.name+'\')">📷 写真を設定</button>'+((S.photos&&S.photos[p.name])?'<button class="btn mini sub" onclick="clearPlayerPhoto(\''+p.name+'\')">写真を消す</button>':'')+'</div></div>';
}
/* --- シーズン --- */
function renderSeason(){
  const sorted=S.standings.map((t,i)=>({t,i,rate:t.w+t.l?t.w/(t.w+t.l):0})).sort((a,b)=>b.rate-a.rate||b.w-a.w);
  const lead=sorted[0];
  const noGames=S.standings.every(t=>!(t.w>0)&&!(t.l>0)&&!(t.d>0)); // 全チーム未消化の間はGBを全行「--」に統一（1位だけ「--」で他が0.0になる不揃いを防ぐ）
  const rows=sorted.map((x,r)=>{const gb=(r===0||noGames)?'--':(((lead.t.w-x.t.w)+(x.t.l-lead.t.l))/2).toFixed(1);
    return '<tr class="'+(x.i===0?'me-row':'')+'"><td>'+(r+1)+'位 '+x.t.name+'</td><td>'+x.t.w+'</td><td>'+x.t.l+'</td><td>'+x.t.d+'</td><td>'+x.rate.toFixed(3)+'</td><td>'+gb+'</td></tr>';}).join('');
  openPanel('🏆 シーズン順位表（'+S.year+'年目・全24戦）',
   '<table class="stand"><tr><th>チーム</th><th>勝</th><th>敗</th><th>分</th><th>勝率</th><th>GB</th></tr>'+rows+'</table>'+
   (()=>{if(!S.hrRace){const ownedNames=new Set(S.players.filter(pl=>pl.real).map(pl=>pl.name+'|'+pl.team));S.hrRace=shuffle(REAL_PLAYERS.filter(r=>r.pos!=='投手'&&!ownedNames.has(r.name+'|'+r.team))).slice(0,5).map(r=>({name:r.name,hr:0}));save();} // シャッフルは Fisher-Yates（sort(ランダム) の偏り回避）、重複名は名前+球団で判定 // 開幕時は全員0本（試合ごとに finishMatch で増える）。生成したら保存し、開き直すたびに顔ぶれが変わらないようにする。自軍加入済みの実在選手はレース側に入れない（二重表示防止）
     const mine=S.players.filter(pl=>pl.kind==='B').sort((a,b)=>b.ss.hr-a.ss.hr)[0];
     const race=S.hrRace.filter(r=>!(mine&&r.name===mine.name)).concat(mine?[{name:mine.name+'（自軍）',hr:mine.ss.hr}]:[]).sort((a,b)=>b.hr-a.hr).slice(0,5);
     if(!race.length||race[0].hr<=0)return '<h3 style="margin-top:10px">⚾ 本塁打王レース</h3><p class="small">まだ今季の本塁打は出ていない。最初の1本を打つのは誰だ？</p>'; // 全員0本の間は架空の順位を並べない
     return '<h3 style="margin-top:10px">⚾ 本塁打王レース</h3>'+race.map((r,i)=>'<div class="card">'+(i+1)+'位 '+r.name+' — '+r.hr+'本</div>').join('');})()+
   (()=>{if(S.phase!=='season')return '';const od=CPU_TEAMS[(S.gameNo-1)%CPU_TEAMS.length];const rl=REAL_PLAYERS.filter(r=>r.team===od.realTeam);const tp=rl.filter(r=>r.kind==='P').sort((a,b)=>(b.vel+b.ctl+b.brk+b.sta)-(a.vel+a.ctl+a.sta))[0];const tb=rl.filter(r=>r.kind==='B').sort((a,b)=>(b.meet+b.pow)-(a.meet+a.pow)).slice(0,9);const str=tb.length?Math.round(tb.reduce((s,r)=>s+(r.meet+r.pow)/2,0)/tb.length):od.base*10;return '<div class="card" style="margin-top:10px">🔍 次戦プレビュー<br>相手：<b>'+od.name+'</b>（総合力 '+str+'）<br>相手先発：<b>'+(tp?tp.name:'不明')+'</b>'+(tp?'（球速目安 約'+Math.round(118+tp.vel*0.42)+'km/h）':'')+'</div>';})()+
   '<p class="small" style="margin-top:8px">次の試合：<b>'+nextMatchLabel()+'</b><br>3位以内でクライマックス進出、優勝で日本シリーズへ。シーズンは一生エンドレスに続く。選手は歳を取り、引退し、新人が入る。</p>'+
   '<div class="flexrow"><button class="btn gold" onclick="closePanel();startMatch();">⚾ 次の試合へ</button></div>');
}
/* --- 選手・育成 --- */
function sortPlayers(arr){const k=S._sort||'ovr';const cp=arr.slice();
  if(k==='age')cp.sort((a,b)=>a.age-b.age);else if(k==='lv')cp.sort((a,b)=>b.lv-a.lv||overall(b)-overall(a));
  else if(k==='hr')cp.sort((a,b)=>(b.ss.hr-a.ss.hr)||overall(b)-overall(a));
  else if(k==='form')cp.sort((a,b)=>((b.form||0)-(a.form||0))||overall(b)-overall(a)); // 調子順
  else cp.sort((a,b)=>overall(b)-overall(a));return cp;}
function doCamp(){
  if(S.campYear===S.year){toast('キャンプは年1回まで');return;}
  if(S.coins<500){toast('コインが足りない！（500必要）');return;}
  const ys=S.players.filter(pl=>pl.age<=26).sort((a,b)=>overall(b)-overall(a)).slice(0,3);
  if(!ys.length){toast('26歳以下の若手がいないので、キャンプは開けない（コインは消費しない）');return;}
  // 実行前に確認モーダル（対象若手と効果を明示）
  modal('🏕 キャンプ確認','<div class="center">若手3名をキャンプで鍛える（500コイン・年1回まで）<br><br>'+ys.map(pl=>'<b>'+pl.name+'</b>（'+pl.age+'歳・総合'+overall(pl)+'）').join('<br>')+'<br><br><span class="small">効果：各選手の能力がランダムで1つ +3 上がる</span></div>');
  $('modal-body').innerHTML+='<div class="flexrow" style="justify-content:center;margin-top:6px"><button class="btn gold" onclick="doCampExec()">🏕 この内容で実施する</button></div>';
}
function doCampExec(){
  closeModal();
  if(S.campYear===S.year||S.coins<500)return;
  const ys=S.players.filter(pl=>pl.age<=26).sort((a,b)=>overall(b)-overall(a)).slice(0,3);
  if(!ys.length)return;
  S.coins-=500;S.campYear=S.year;
  const grown=ys.map(pl=>{const keys=pl.kind==='P'?['vel','ctl','brk','sta']:['meet','pow','run','def'];const k1=pick(keys);pl[k1]=clamp(pl[k1]+3,20,99);return pl.name+'（'+STAT_JP[k1]+'+3）';});
  sfx('level');save();toast('🏕 キャンプ完了！ '+grown.join('・')+' が成長した');renderRoster();
}
function doTrade(){
  if(S.tradeYear===S.year){toast('トレードは年1回まで');return;}
  const bench=S.players.filter(pl=>pl.kind==='B'&&!pl.real&&pl.name!=='小林 タツ').sort((a,b)=>overall(a)-overall(b))[0]; // 実在選手と主人公は放出しない
  const owned=new Set(S.players.filter(pl=>pl.real).map(pl=>pl.name+'|'+pl.team));
  const pool=REAL_PLAYERS.filter(r=>r.pos!=='投手'&&!owned.has(r.name+'|'+r.team)); // 重複判定は名前+球団（同名の別選手を巻き込まない）
  if(!bench||!pool.length){toast('トレード相手が見つからない');return;}
  if(!confirm(bench.name+'（'+bench.pos+'・総合'+overall(bench)+'）を放出して、実在選手を獲得する？\n獲得条件：まだ加入していない実在の野手からランダムで1名（候補 '+pool.length+' 名）。トレードは年1回まで。'))return;
  S.tradeYear=S.year;S.players=S.players.filter(x=>x!==bench);
  const np=realToPlayer(pick(pool));S.players.push(np);sfx('gacha');save();
  toast('🔁 トレード成立！ '+np.name+' が加入');S.news.unshift('🔁 トレードで '+np.name+' を獲得（'+bench.name+' を放出）');renderRoster();
}
function renderRoster(){
  const bs=sortPlayers(S.players.filter(p=>p.kind==='B'));
  let ps=sortPlayers(S.players.filter(p=>p.kind==='P'));
  if(!ps.length)ps=S.players.filter(p=>p.kind==='P').sort((a,b)=>overall(b)-overall(a));
  const tab=S._rosterTab||'all';
  let h='<div class="small">TP（特訓ポイント）は試合とスカウト重複で貯まる。特訓1回=3TPで選んだ能力+2〜4。Lvは試合経験で上がる。</div>'+
  '<div class="flexrow" style="margin:6px 0"><select class="sort-sel" onchange="S._sort=this.value;renderRoster()"><option value="ovr"'+(S._sort==='ovr'?' selected':'')+'>総合順</option><option value="lv"'+(S._sort==='lv'?' selected':'')+'>Lv順</option><option value="age"'+(S._sort==='age'?' selected':'')+'>若い順</option><option value="hr"'+(S._sort==='hr'?' selected':'')+'>本塁打順</option><option value="form"'+(S._sort==='form'?' selected':'')+'>調子順</option></select><button class="btn mini" onclick="doCamp()"'+(S.campYear===S.year||S.coins<500?' disabled':'')+'>🏕 '+(S.campYear===S.year?'キャンプ済（年1回）':'キャンプ(500)')+'</button><button class="btn mini" onclick="doTrade()"'+(S.tradeYear===S.year?' disabled':'')+'>🔁 '+(S.tradeYear===S.year?'トレード済（年1回）':'トレード')+'</button></div>'+
  '<div class="flexrow" style="margin:2px 0 8px"><button class="btn mini'+(tab==='all'?' gold':' sub')+'" onclick="S._rosterTab=\'all\';renderRoster()">全員（'+S.players.length+'）</button><button class="btn mini'+(tab==='B'?' gold':' sub')+'" onclick="S._rosterTab=\'B\';renderRoster()">打者（'+bs.length+'）</button><button class="btn mini'+(tab==='P'?' gold':' sub')+'" onclick="S._rosterTab=\'P\';renderRoster()">投手（'+ps.length+'）</button></div>';
  if(tab!=='P')h+='<h3>打者</h3>'+bs.map(p=>playerCard(p,' <button class="btn mini" onclick="trainMenu('+p.id+')">特訓</button>')).join('');
  if(tab!=='B')h+='<h3>投手</h3>'+ps.map(p=>playerCard(p,' <button class="btn mini" onclick="trainMenu('+p.id+')">特訓</button>')).join('');
  openPanel('👥 選手・育成',h);
}
function trainMenu(pid){
  const p=S.players.find(x=>x.id===pid);if(!p)return;
  const stats=p.kind==='P'?[['vel','球速'],['ctl','制球'],['brk','変化'],['sta','体力']]:[['meet','ミート'],['pow','パワー'],['run','走力'],['def','守備']];
  openPanel('💪 特訓：'+p.name,'<p>TP: '+S.tp+'（1回 3TP）</p>'+stats.map(s=>{const v=p[s[0]];return '<div class="card"><b>'+s[1]+'</b> 現在 '+v+' <span class="statbar"><i style="width:'+clamp(v,0,100)+'%"></i></span> '+(v>=99?'<span class="small">👑 MAX（これ以上上がらない）</span>':((v>=95?'<span class="small">あと'+(99-v)+'でMAX！</span> ':'')+'<button class="btn mini gold" onclick="doTrain('+pid+',\''+s[0]+'\')"'+(S.tp<3?' disabled':'')+'>+特訓</button>'))+'</div>';}).join('')+'<button class="btn mini" onclick="renderRoster()">← 選手一覧へ</button>');
}
function doTrain(pid,key){
  const p=S.players.find(x=>x.id===pid);if(!p)return;
  if(p.inj>0){toast('🩹 故障中は特訓できない（あと'+p.inj+'試合）');return;}
  if(p[key]>=99){toast('👑 その能力はもうMAX（99）だ');trainMenu(pid);return;}
  if(S.tp<3){toast('TPが足りない！ 試合やスカウトで貯めよう');return;}
  S.tp-=3;const up=ri(2,4);p[key]=clamp(p[key]+up,20,99);missionAdd('train',1);sfx('level');save();
  toast(p.name+' の'+(STAT_JP[key]||'能力')+'が +'+up+' 上がった！');popupN('+'+up,'#7be495');trainMenu(pid);refreshHUD();
}
/* --- スカウト（ガチャ） --- */
/* --- 写真インポート（本人の端末の写真だけを使う：外部送信なし・端末内保存） --- */
let photoTarget=null;
function setPlayerPhoto(name){photoTarget=name;$('photo-input').click();toast(name+' の写真を選んでね（端末内だけに保存される）');}
function clearPlayerPhoto(name){if(S.photos)delete S.photos[name];Object.keys(_portraitCache).forEach(k=>{if(k.includes(name))delete _portraitCache[k];});save();renderRoster();toast('写真を消した');}
function onPhotoFile(ev){
  const f=ev.target.files&&ev.target.files[0];if(!f||!photoTarget)return;
  const img=new Image();
  img.onload=()=>{
    const W=168,H=200,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
    const s=Math.max(W/img.width,H/img.height);x.drawImage(img,(W-img.width*s)/2,(H-img.height*s)/2,img.width*s,img.height*s);
    if(!S.photos)S.photos={};
    S.photos[photoTarget]=cv.toDataURL('image/jpeg',0.82);
    Object.keys(_portraitCache).forEach(k=>{if(k.includes(photoTarget))delete _portraitCache[k];});
    save();sfx('coin');vib('0,30');toast(photoTarget+' の写真を設定した！');photoTarget=null;ev.target.value='';
    if(!$('screen-panel').classList.contains('hidden'))renderRoster();
  };
  img.onerror=()=>toast('その画像は読み込めなかった');
  const rd=new FileReader();rd.onload=()=>{img.src=rd.result;};rd.readAsDataURL(f);
}
function renderScout(resultHtml){
  openPanel('🔍 スカウト（1回 300コイン）',
   '<p>新しい選手を発掘する。確率は N 45% / R 30% / SR 17% / SSR 6.5% / <span class="rarity-LEGEND">LEGEND 1.5%</span>。<br>登録枠は打者32人・投手16人まで。枠がいっぱいの選手は加入せず、代わりにTP+5が入る。<br>現在の登録：打者 '+S.players.filter(p=>p.kind==='B').length+'/32 ・ 投手 '+S.players.filter(p=>p.kind==='P').length+'/16<br>📷 選手カードの「写真を設定」から、自分のスマホにある実写真をその選手の顔写真にできます（写真は端末の中だけに保存され、外に送られません）。</p>'+
   '<div class="flexrow"><button class="btn gold big" onclick="doScout()"'+(S.coins<300?' disabled':'')+'>🔍 スカウトする（300）</button><button class="btn gold big" onclick="doScout10()"'+(S.coins<2700?' disabled':'')+'>🔍 10連（2700・1回分お得）</button><span>所持コイン: '+fmt(S.coins)+'</span></div>'+
   (S.coins<300?'<p class="small">あと '+fmt(300-S.coins)+' コインでスカウトできる</p>':S.coins<2700?'<p class="small">10連まであと '+fmt(2700-S.coins)+' コイン</p>':'')+
   '<p class="small">🎰 天井まであと '+(30-(S.scoutPity||0))+' 回（30回でSSR以上確定・10連でもカウント）</p>'+
   '<div class="card" style="margin-top:10px"><b>🌟 リアル選手スカウト（800コイン）</b><br><span class="small">NPB12球団＋MLBの実在選手 '+REAL_PLAYERS.length+'名からランダムで1名が必ず加入！（未加入の選手のみ・登録枠に空きのある種別から選ばれる）大谷翔平・山本由伸・ジャッジ・村上宗隆…全員実名・実能力値。</span>'+(S.coins<800?'<br><span class="small">あと '+fmt(800-S.coins)+' コインで引ける</span>':'')+'<br><button class="btn gold" onclick="doRealScout()"'+(S.coins<800?' disabled':'')+'>🌟 リアル選手を獲得する（800）</button></div>'+(resultHtml||''));
}
function scoutPull(){
  // 1回分の抽選（天井カウント共有）。戻り値 {p, joined, kind}
  const kind=Math.random()<0.32?'P':'B';
  S.scoutPity=(S.scoutPity||0)+1;
  let p;
  if(S.scoutPity>=30){p=genPlayer(kind,'SSR',S.year*0.4);S.scoutPity=0;}
  else{p=genPlayer(kind,null,S.year*0.4);if(p.rarity==='SSR'||p.rarity==='LEGEND')S.scoutPity=0;}
  let joined=true;
  if(S.players.filter(x=>x.kind===kind).length>=(kind==='P'?16:32)){S.tp+=5;joined=false;} // 登録枠：投手16人・打者32人
  else S.players.push(p);
  return {p,joined,kind};
}
function doScout(){
  if(S.coins<300){toast('コインが足りない！ 試合で稼ごう');return;}
  S.coins-=300;missionAdd('scout',1);sfx('gacha');
  const pityBefore=S.scoutPity||0;
  const r=scoutPull(),p=r.p;
  if(pityBefore+1>=30)toast('🎰 天井到達！ SSR以上確定スカウト！');
  const extra=r.joined?playerCard(p):'<br>枠がいっぱいのため見送り、代わりに TP+5';
  if(p.rarity==='SSR'||p.rarity==='LEGEND'){flash();banner(p.rarity+' 出現！！');vib('0,80,60,160');popupN(p.rarity+'!','#ffd94d');}
  S.news.unshift(p.rarity+' の'+(r.kind==='P'?'投手':'選手')+' '+p.name+' を発掘！');save();refreshHUD();
  renderScout('<div class="gacha-result">✨ 結果 ✨</div>'+extra);
}
function doScout10(){
  if(S.coins<2700){toast('コインが足りない！（10連は2700必要）');return;}
  S.coins-=2700;missionAdd('scout',10);sfx('gacha');
  const res=[];for(let i=0;i<10;i++)res.push(scoutPull());
  const cnt={};res.forEach(r=>{cnt[r.p.rarity]=(cnt[r.p.rarity]||0)+1;});
  const cntTxt=['LEGEND','SSR','SR','R','N'].filter(k=>cnt[k]).map(k=>'<span class="rarity-'+k+'">'+k+'×'+cnt[k]+'</span>').join(' / ');
  const skipped=res.filter(r=>!r.joined).length;
  if(cnt.SSR||cnt.LEGEND){flash();banner('10連で '+(cnt.LEGEND?'LEGEND ':'')+(cnt.SSR?'SSR ':'')+'出現！');vib('0,80,60,160');sfx('hr');}
  S.news.unshift('スカウト10連：'+['LEGEND','SSR','SR','R','N'].filter(k=>cnt[k]).map(k=>k+'×'+cnt[k]).join(' '));save();refreshHUD();
  renderScout('<div class="gacha-result">✨ 10連結果 ✨</div><div class="card" style="text-align:center"><b>'+cntTxt+'</b>'+(skipped?'<br><span class="small">枠満杯で見送り '+skipped+'名分は TP+'+(skipped*5)+' に変換</span>':'')+'</div>'+
   res.slice().sort((a,b)=>overall(b.p)-overall(a.p)).map(r=>playerCard(r.p)+(r.joined?'':'<p class="small" style="margin:-4px 0 8px">↪ 枠満杯で見送り（TP+5に変換済み）</p>')).join(''));
}
function doRealScout(){
  if(S.coins<800){toast('コインが足りない！（800必要）');return;}
  const owned=new Set(S.players.filter(p=>p.real).map(p=>p.name+'|'+p.team)); // 重複判定は名前+球団（ヤクルトのオスナ所持でソフトバンクのオスナまで除外しない）
  // 登録枠（打者32人・投手16人）を通常スカウトと同じく尊重する：満杯の種別は抽選対象から外す
  const roomB=S.players.filter(x=>x.kind==='B').length<32, roomP=S.players.filter(x=>x.kind==='P').length<16;
  const pool=REAL_PLAYERS.filter(r=>!owned.has(r.name+'|'+r.team)&&(r.pos==='投手'?roomP:roomB));
  if(!pool.length){toast(owned.size>=REAL_PLAYERS.length?'実在選手は全員加入済み！ すごいコレクションだ':'登録枠がいっぱいで加入できない（打者32人・投手16人まで）。トレードで枠を空けよう');return;}
  S.coins-=800;missionAdd('scout',1);sfx('gacha');flash();
  const r=pick(pool);const p=realToPlayer(r);S.players.push(p);
  banner('🌟 実在選手加入！\n'+p.name);sfx('hr');
  S.news.unshift('🌟 実在選手 '+p.name+'（'+p.team+'）が加入！');save();refreshHUD();
  renderScout('<div class="gacha-result">🌟 リアル選手スカウト結果 🌟</div>'+playerCard(p));
}
/* --- 球場 --- */
const NEXT_UNLOCK={1:'Lv2で大型ビジョン（ホークスビジョン）が付く！',2:'Lv3で照明塔と開閉式ドーム屋根が付く！',3:'Lv4で大型ビジョンがさらに大きくなる！',4:'Lv5でスタンドが一段大きくなる！',5:'Lv6で外野フェンスが高くなり、スタンドも拡大！',6:'Lv7でバックネット裏スタンドが拡大！',7:'Lv8でスタンドがさらに大きくなる！',8:'Lv9で球場がほぼ完成形に近づく！',9:'Lv10で伝説の球場が完成する！'};
function renderStadium(){
  const lv=S.stadiumLv,cost=stadiumCost(lv);
  const stars=S.players.filter(p=>p.rarity==='SSR'||p.rarity==='LEGEND').length;
  openPanel('🏟️ 球場：'+STADIUM_NAMES[lv-1]+'（Lv'+lv+'）',
   '<p>拡張するとホームの3D球場が実際に大きく育つ。観客収入（放置収益）とチケット収入が増える。</p>'+
   '<p>現在の毎分収入：<b>'+idleRatePerMin()+'コイン</b>（内訳：球場Lv '+lv*3+' ＋ ファン '+Math.floor(S.fans/600)+' ＋ スター選手 '+stars*2+'） / 収容ファン基盤：'+fmt(S.fans)+'人</p>'+
   (lv>=10?'<p><b>最大まで育ちきった伝説の球場！</b></p>':'<p>🔜 次の拡張：'+NEXT_UNLOCK[lv]+'<br>拡張後の毎分収入：<b>'+((lv+1)*3+Math.floor(S.fans/600)+stars*2)+'コイン</b></p><div class="flexrow"><button class="btn gold" onclick="upgradeStadium()"'+(S.coins<cost?' disabled':'')+'>拡張する（'+fmt(cost)+'コイン）→ '+STADIUM_NAMES[lv]+'</button></div>'+(S.coins<cost?'<p class="small">あと '+fmt(cost-S.coins)+' コインで拡張できる。</p>':''))+
   '<p class="small">Lv2で大型ビジョン（ホークスビジョン）、Lv3で照明塔と開閉式ドーム屋根が付く。Lvが上がるほどスタンドも大きくなる。</p>');
}
function upgradeStadium(){
  const cost=stadiumCost(S.stadiumLv);
  if(S.coins<cost){toast('コインが足りない！');return;}
  S.coins-=cost;S.stadiumLv++;sfx('level');banner('球場が進化！\n'+STADIUM_NAMES[S.stadiumLv-1]);S.news.unshift('球場が「'+STADIUM_NAMES[S.stadiumLv-1]+'」に進化！');
  save();checkAch();buildStadium();renderStadium();refreshHUD();
}
/* --- 記録 --- */
function renderRecords(){
  // 今季チーム内ランキング（打率は30打席以上が対象）
  const bs=S.players.filter(p=>p.kind==='B'), ps=S.players.filter(p=>p.kind==='P');
  const top=(arr,fn,fmtFn)=>arr.slice().sort((a,b)=>fn(b)-fn(a)).slice(0,3).map((p,i)=>'<div class="card">'+(i+1)+'位 <b>'+p.name+'</b> <span class="small">'+fmtFn(p)+'</span></div>').join('');
  const abMin=[30,10,1].find(t=>bs.some(p=>p.ss.ab>=t))||30; // 打率ランキングの規定打席：シーズン序盤は30打席到達者がいないため段階的に下げる
  // 記録ゼロの部門は「まだ記録なし」を部門ごとに繰り返さず、末尾に1行へまとめる
  const cats=[
   ['打率（'+abMin+'打席以上）',top(bs.filter(p=>p.ss.ab>=abMin),p=>p.ss.ab?p.ss.h/p.ss.ab:0,p=>avgText(p)+'（'+p.ss.h+'安打）')],
   ['本塁打',top(bs.filter(p=>p.ss.hr>0),p=>p.ss.hr,p=>p.ss.hr+'本')],
   ['打点',top(bs.filter(p=>p.ss.rbi>0),p=>p.ss.rbi,p=>p.ss.rbi+'打点')],
   ['盗塁',top(bs.filter(p=>(p.ss.sb||0)>0),p=>p.ss.sb||0,p=>(p.ss.sb||0)+'盗塁')],
   ['奪三振',top(ps.filter(p=>p.ss.k>0),p=>p.ss.k,p=>p.ss.k+'奪三振 / 防御率相当 '+eraText(p))],
  ];
  const leaders='<h3>📊 今季チーム内ランキング</h3>'+
   cats.filter(c=>c[1]).map(c=>'<p class="small" style="margin-top:6px">'+c[0]+'</p>'+c[1]).join('')+
   (cats.some(c=>!c[1])?'<p class="small" style="margin-top:6px">'+cats.filter(c=>!c[1]).map(c=>c[0]).join('・')+'：まだ記録なし</p>':'');
  const ach=ACHS.map(a=>{const got=S.ach.includes(a.id);const pr=ACH_PROG[a.id];return '<div class="card">'+(got?'✅':'🔒')+' <b>'+a.label+'</b> <span class="small">報酬'+a.reward+'コイン</span>'+(!got&&pr?' <span class="small">進捗 '+Math.min(pr[0](),pr[1])+' / '+pr[1]+'</span>':'')+'</div>';}).join('');
  const hof=S.hof.length? S.hof.map(h=>'<div class="card"><img class="portrait-s" src="'+drawPortrait({name:h.name,team:'スターズ',pos:'',kind:'B',meet:50,pow:50,run:50,def:50,vel:50,ctl:50,brk:50,sta:50})+'">👑 <b>'+h.name+'</b> <span class="small">'+h.year+'年に殿堂入り / '+h.note+'</span></div>').join(''):'<p class="small">まだ殿堂入り選手はいない。長く活躍した選手が引退すると殿堂入りする。</p>';
  openPanel('📖 記録・殿堂','<p>通算：'+S.career.wins+'勝 '+S.career.losses+'敗 '+S.career.draws+'分 / 安打'+S.career.hits+' / 本塁打'+S.career.hr+' / 奪三振'+S.career.ks+'<br>リーグ優勝 '+S.career.titles+'回 / 日本一 '+S.career.japan+'回 / 経過 '+S.year+'年</p>'+(S.champYear&&S.champYear.length?'<p class="small">👑 日本一の年：'+S.champYear.map(y=>y+'年目').join('、')+'</p>':'')+leaders+'<h3>🏅 実績</h3>'+ach+'<h3>👑 殿堂入り</h3>'+hof);
}
/* --- ミッション --- */
function renderMissions(){
  ensureMissions();
  const h=S.missions.list.map((m,i)=>'<div class="card"><b>'+m.label+'</b> （'+m.prog+'/'+m.target+'） <span class="statbar"><i style="width:'+clamp(Math.round(m.prog/m.target*100),0,100)+'%"></i></span> <span class="small">報酬'+m.reward+'コイン</span> '+(m.claimed?'✅ 受取済':(m.prog>=m.target?'<button class="btn mini gold" onclick="claimMission('+i+')">受け取る</button>':'進行中'))+'</div>').join('');
  openPanel('🎯 今日のミッション',h+(S.missions.list.every(m=>m.claimed)?'<p>🎉 今日のミッションは全て完了！ お疲れさま。明日0時に新しいミッションが届くよ。</p>':'')+'<p class="small">ミッションは毎日0時に新しくなる。</p>');
}
function claimMission(i){const m=S.missions.list[i];if(!m||m.claimed||m.prog<m.target)return;m.claimed=true;S.coins+=m.reward;sfx('coin');save();renderMissions();refreshHUD();toast('報酬 '+m.reward+'コイン ゲット！');}
/* --- ヘルプ --- */
function setVol(k,v){if(!S.settings)S.settings={se:1,crowd:1,mute:false};S.settings[k]=parseFloat(v);save();toast('音量を調整した');}
function renderHelp(){
  openPanel('？ 遊び方','<p><b>攻撃：</b>投手が投げたら、ボールがホームに届く瞬間に「スイング！」をタップ。ジャストだと強い打球。早いとレフト方向、遅いとライト方向へ流れる。見送ればボール/ストライク判定。</p>'+
  '<p><b>守備：</b>球種を選んで、メーターが金色ゾーンで止まるように「投げる！」。完璧な投球ほど三振と弱い打球が増える。先発が疲れたら「🔄 継投」で控え投手に交代できる（1試合2回まで）。</p>'+
  '<p><b>盗塁：</b>攻撃時、走者が一塁/二塁にいて次の塁が空いている時に「💨 盗塁」。成功率は走者の走力で決まる。失敗すると走者がアウトになる。</p>'+
  '<p><b>スカウト10連：</b>2700コインで10回まとめて引ける（1回分お得）。天井カウントも10回分進む。</p>'+
  '<p><b>一生ループ：</b>24戦シーズン→順位でクライマックス/日本シリーズ→選手の成長・衰え・引退・ドラフト→次の年。球場は稼いだコインで育ち、3Dで大きくなる。放置でも観客収入が貯まる。</p>'+
  '<p><b>稼ぎ方：</b>ヒット・ホームラン・勝利でコイン。スカウト（ガチャ）で LEGEND を狙い、特訓で育てよう。</p>'+
  '<p><b>ミートカーソル（プロスピA式）：</b>投球中、右上のゾーンに白いボールの到達点が流れる。金のリングを指でドラッグして重ねると芯で捉えられる。</p>'+
  '<p><b>みずほPayPayドーム：</b>球場Lv3から開閉式屋根つきドームに。7回裏は黄色いジェット風船、勝利後は花火。人工芝＋ホークスビジョン＋ホームランテラス再現。</p>'+
  '<p><b>アプリ機能：</b>打撃や勝利で本体が振動、結果の共有、毎朝9時の通知リマインダー、写真は端末のピッカーから選択。</p>'+
  '<p>🔊 音量 SE <input type="range" min="0" max="1" step="0.1" value="'+(S.settings?S.settings.se:1)+'" onchange="setVol(\'se\',this.value)"> 観客 <input type="range" min="0" max="1" step="0.1" value="'+(S.settings?S.settings.crowd:1)+'" onchange="setVol(\'crowd\',this.value)"> <span class="small">アプリ版 v'+(window.NativeApp?NativeApp.appVersion():'Web')+'</span></p>'+
  '<p class="small">自作明記：3D球場・選手モデル、試合ロジック、育成/シーズン/ガチャ等のシステムは全て自作コード。ライブラリは Three.js、フォントは M PLUS 系を使用。似顔絵は特徴を寄せた自作イラスト（写真ではない）。</p>'+
  '<button class="btn mini danger" onclick="if(confirm(\'本当に最初からやり直す？\')){localStorage.removeItem(SAVE_KEY);location.reload();}">データを消して最初から</button>');
}

/* ============================================================
   試合エンジン
   ============================================================ */
let M=null;
const INN_DEFAULT=6;
function buildLineup(){
  let bs=S.players.filter(p=>p.kind==='B'&&!(p.inj>0)).sort((a,b)=>overall(b)-overall(a));
  if(bs.length<9)bs=S.players.filter(p=>p.kind==='B').sort((a,b)=>overall(b)-overall(a));
  bs=bs.slice(0,9);
  if(!bs.length){const em=genPlayer('B','R',0);em.name='助っ人 '+em.name;em.temp=true;bs=[em];}
  // 4番はパワー最強
  const four=bs.reduce((a,b)=>b.pow>a.pow?b:a,bs[0]);
  const rest=bs.filter(p=>p!==four);
  const lineup=[rest[0],rest[1],rest[2],four,rest[3],rest[4],rest[5],rest[6],rest[7]].filter(Boolean);
  // 人数が足りない時は同一選手を重複させず、助っ人（育成選手）で埋める
  while(lineup.length<9){const em=genPlayer('B','N',0);em.name='助っ人 '+em.name;em.temp=true;lineup.push(em);}
  return lineup;
}
function myStarter(){
  const all=S.players.filter(p=>p.kind==='P').sort((a,b)=>overall(b)-overall(a));
  const healthy=all.filter(p=>!(p.inj>0)); // 故障中の投手を先発にしない
  const ps=healthy.length?healthy:all;
  return ps[(S.gameNo-1)%ps.length]||ps[0];
}
function cpuTeamGen(teamDef,strBonus){
  // 実在チーム：その球団の実在選手で打線と投手を組む（足りない分は同水準の控え選手で補充）
  const bonus=(strBonus||0)+S.year*0.8;
  const reals=REAL_PLAYERS.filter(r=>teamDef.realTeam==='MLB'?r.mlb:r.team===teamDef.realTeam);
  const rb=reals.filter(r=>r.kind==='B').sort((a,b)=>(b.meet+b.pow)-(a.meet+a.pow));
  const rp=reals.filter(r=>r.kind==='P').sort((a,b)=>(b.vel+b.ctl+b.brk)-(a.vel+a.ctl+a.brk));
  const avgB=rb.length?rb.reduce((s,r)=>s+r.meet+r.pow,0)/rb.length/2:60;
  const batters=rb.slice(0,9).map(r=>Object.assign({},r,{team:r.team}));
  while(batters.length<9){const g={name:pick(SURNAMES)+' '+pick(FIRSTNAMES),team:teamDef.realTeam,pos:'控え',kind:'B',real:false,meet:clamp(Math.round(avgB+bonus+rf(-9,7)),30,95),pow:clamp(Math.round(avgB+bonus+rf(-9,9)),30,95),run:ri(40,80),def:60,vel:50,ctl:50,brk:50,sta:60};batters.push(g);}
  const pitcher=rp.length?Object.assign({},rp[(S.gameNo-1)%rp.length]):{name:pick(SURNAMES)+' '+pick(FIRSTNAMES),team:teamDef.realTeam,kind:'P',real:false,vel:80,ctl:75,brk:75,sta:80,meet:35,pow:35,run:45,def:60};
  ['vel','ctl','brk'].forEach(k=>{pitcher[k]=clamp(Math.round(pitcher[k]+bonus),25,99);});
  batters.forEach(b=>{b.meet=clamp(Math.round(b.meet+bonus*0.6),25,99);b.pow=clamp(Math.round(b.pow+bonus*0.6),25,99);});
  const str=Math.round(batters.reduce((s,b)=>s+(b.meet+b.pow)/2,0)/9);
  return {name:teamDef.name,short:teamDef.short,color:teamDef.color,batters,pitcher,str};
}
function realToPlayer(r){
  const ov=r.kind==='P'?(r.vel+r.ctl+r.brk+r.sta)/4:(r.meet+r.pow+r.run+r.def)/4;
  const SKILLMAP={'大谷翔平':'二刀流','千賀滉大':'お化けフォーク','周東佑京':'韋駄天','スキーンズ':'豪速球','今井達也':'奪三振王','ジャッジ':'パワーヒッター','村上宗隆':'パワーヒッター','近藤健介':'安打製造機','菊池涼介':'守備職人','山本由伸':'勝負強い','佐々木朗希':'豪速球','源田壮亮':'守備職人','近本光司':'韋駄天'};
  return {id:uidC++,name:r.name,team:r.team,age:ri(21,33),kind:r.kind,rarity:ov>=86?'SSR':ov>=78?'SR':'R',
    meet:r.meet,pow:r.pow,run:r.run,def:r.def,vel:r.vel,ctl:r.ctl,brk:r.brk,sta:r.sta,
    lv:1,exp:0,potential:ov>=85?'S':'A',skill:SKILLMAP[r.name]||(Math.random()<0.3?pick(SKILLS):null),
    ss:{ab:0,h:0,hr:0,rbi:0,sb:0,ip:0,k:0,er:0,w:0},retired:false,real:true,pos:r.pos,no:NUMBERS[r.name]};
}
function startMatch(){
  closePanel();
  if(S.phase==='draft'){openDraft();return;}
  let oppDef,bonus=0,label='';
  if(S.phase==='cs'){oppDef=pick(CPU_TEAMS);bonus=7;label='クライマックス・ファイナル';}
  else if(S.phase==='js'){oppDef=WORLD_TEAM;bonus=9;label='日本シリーズ改め 世界一決定戦';}
  else{oppDef=CPU_TEAMS[(S.gameNo-1)%CPU_TEAMS.length];label='シーズン第'+S.gameNo+'戦';}
  M={phase:S.phase,label,oppDef,opp:cpuTeamGen(oppDef,bonus),lineup:buildLineup(),starter:myStarter(),
     inning:1,half:'top',outs:0,balls:0,strikes:0,bases:[null,null,null],score:{me:0,cpu:0},
     li:0,ci:0,busy:false,ballLive:false,ballP:0,swungEarly:false,finished:false,
     pa:{},pit:{outs:0,k:0,er:0},teamHits:0,teamHr:0,teamK:0,teamEr:0,maxInn:INN_DEFAULT,lines:{me:[],cpu:[]},gameStats:{},oppPitches:0,myPitches:0,pinchUsed:false,relieved:0,_usedPitchers:[]};
  modal('⚾ 試合開始：'+label,'<div class="center">対戦相手：<b>'+M.opp.name+'</b>（総合力 '+M.opp.str+'）<br>先発投手：<b>'+M.starter.name+'</b>（総合'+overall(M.starter)+'）<br>相手先発：<b>'+M.opp.pitcher.name+'</b>（球速目安 約'+Math.round(118+M.opp.pitcher.vel*0.42)+'km/h）<br>相手打線の軸：'+M.opp.batters.slice().sort((a,b)=>(b.meet+b.pow)-(a.meet+a.pow)).slice(0,3).map(b=>b.name+'（ミート'+b.meet+'・パワー'+b.pow+'）').join('、')+((S.rival&&M.opp.pitcher&&M.opp.pitcher.name===S.rival)?'<br>🔥 相手先発は宿敵 '+S.rival+'！ 勝てばボーナス+100':'')+'<br><br>何回制で戦う？（長いほど報酬UP）<br><span class="small">OKを押すと6回制で始まる</span></div>',
   ()=>{if(M&&!M.begun)beginMatch(6);});
  $('modal-body').innerHTML+='<div class="flexrow" style="justify-content:center;margin-top:6px"><button class="btn" onclick="beginMatch(3)">3回（サクッと）</button><button class="btn gold" onclick="beginMatch(6)">6回（おすすめ）</button><button class="btn" onclick="beginMatch(9)">9回（本格派）</button></div>';
}
function beginMatch(inn){
  if(M.begun)return;
  if(!EXT.ready&&!EXT.failed&&window.THREE&&THREE.GLTFLoader){ // 外部3Dモデルの読み込み待ち（最大8秒で従来モデルにフォールバック）
    toast('🎨 3Dモデル読み込み中…');const t0=Date.now();
    const iv=setInterval(()=>{if(EXT.ready||EXT.failed||Date.now()-t0>8000){clearInterval(iv);beginMatch(inn);}},250);return;}
  M.begun=true;
  try{if(window.NativeApp)NativeApp.keepAwake(true);}catch(e){}
  if(!S.tutoDone){S.tutoDone=true;save();setTimeout(()=>toast('📖 守備：球種→メーターを金ゾーンで止めてリリース！',3600),600);
    setTimeout(()=>toast('📖 打撃：ボールが届く瞬間にスイング！ カーソルで狙うと芯に当たる',4200),5200);}
  M.maxInn=inn;$('modal').classList.add('hidden');modalCb=null;
  $('hud-season').style.visibility='hidden';
  $('screen-home').classList.add('hidden');$('screen-panel').classList.add('hidden');$('screen-game').classList.remove('hidden');
  S._night=S.stadiumLv>=3&&Math.random()<0.5;buildStadium();setCam('bat');startCrowd();
  say('実況：'+M.label+'、'+M.opp.name+'戦、プレイボール！ 先発は'+M.starter.name+'！');
  updateSB();setTimeout(nextPA,800);
}
function say(html){$('commentary').innerHTML=html;}
function updateSB(){
  if(!M)return;
  $('sb-teams').innerHTML='<span>'+M.opp.short+' '+M.score.cpu+'</span> － <span class="me">⭐あなた '+M.score.me+'</span>';
  $('sb-inning').textContent=M.inning+'回'+(M.half==='top'?'表（守備）':'裏（攻撃）');
  $('sb-outs').textContent='アウト '+'●'.repeat(M.outs)+'○'.repeat(3-M.outs);
  $('sb-outs').className=M.outs===2?'cnt-o':''; // 2アウト（ツーアウト）時は赤色で警告
  $('sb-count').innerHTML='<span class="cnt-b">B'+'●'.repeat(M.balls)+'○'.repeat(Math.max(0,4-M.balls))+'</span> <span class="cnt-s">S'+'●'.repeat(M.strikes)+'○'.repeat(Math.max(0,3-M.strikes))+'</span>'; // アウトは sb-outs で別表示するため O は付けない（二重表示防止）
  if(M.lines){let h1=(M.opp.short||'相手')+' ',h2='あなた ';for(let i=0;i<Math.max(M.maxInn,M.inning);i++){h1+=(M.lines.cpu[i]==null?'·':M.lines.cpu[i])+' ';h2+=(M.lines.me[i]==null?'·':M.lines.me[i])+' ';}
    $('sb-lines').textContent=h1+' R'+M.score.cpu+' H'+(M.cpuHits||0)+'\n'+h2+' R'+M.score.me+' H'+M.teamHits;}
  // 盗塁・代打ボタンの可否を状況に合わせて切り替える（押せない理由を目で分かるように）
  const stBtn=$('btn-steal');if(stBtn)stBtn.disabled=!(M.half==='bottom'&&!M.finished&&((M.bases[1]&&!M.bases[2])||(M.bases[0]&&!M.bases[1])));
  const phBtn=$('btn-pinch');if(phBtn){phBtn.disabled=!!(M.pinchUsed||M.half!=='bottom'||M.finished);
    // 代打ボタンに起用候補の名前を出す（誰が出るか分かるように）
    if(M.pinchUsed)phBtn.textContent='代打（使用済）';
    else if(M.half==='bottom'&&!M.finished){const curB=curMyBatter();const benchB=S.players.filter(pl=>pl.kind==='B'&&!pl.retired&&!(pl.inj>0)&&!M.lineup.includes(pl)).sort((a,b)=>(b.meet+b.pow)-(a.meet+a.pow))[0];
      phBtn.textContent=(benchB&&benchB.meet+benchB.pow>curB.meet+curB.pow+4)?'代打：'+benchB.name:'代打';}
    else phBtn.textContent='代打';}
  const rBtn=$('btn-relief');if(rBtn){const rLeft=2-(M.relieved||0);rBtn.textContent=rLeft>0?'🔄 継投（あと'+rLeft+'回）':'🔄 継投（使用済）';rBtn.disabled=rLeft<=0||!!M.finished;}
  const bn=['◇ 空','◆ 1塁','◆ 2塁','◆◆ 2・3塁','◆ 3塁','◆◆ 1・2塁','◆◆ 1・3塁','◆◆◆ 満塁'];
  const mask=(M.bases[0]?1:0)|(M.bases[1]?2:0)|(M.bases[2]?4:0);
  $('sb-bases').textContent=bn[mask===3?5:mask===5?6:mask===6?3:mask]||'◇';
  if(boardCtx)drawBoard(M.opp.short+' '+M.score.cpu+' - '+M.score.me+' あなた',M.inning+'回'+(M.half==='top'?'表':'裏')+' アウト'+M.outs); // 3Dビジョンにもアウトカウントを表示
}
function curMyBatter(){return M.lineup[M.li%M.lineup.length];}
function curCpuBatter(){return M.opp.batters[M.ci%M.opp.batters.length];}
function recPA(id,fn){if(!M.pa[id])M.pa[id]={ab:0,h:0,hr:0,rbi:0};fn(M.pa[id]);}

/* --- 走者進塁と結果適用 --- */
function applyOutcome(side,outcome){
  const isMe=side==='me';const batter=isMe?curMyBatter():curCpuBatter();
  const b=M.bases;let runs=0;const old=[!!b[0],!!b[1],!!b[2]];
  const mark=isMe?(batter.id||'cpu'):null;
  if(outcome==='K'||outcome==='OUT'){
    const outsBefore=M.outs;
    M.outs++;
    if(outcome==='K'&&isMe){/* 打者三振 */}
    if(outcome==='K'&&!isMe){M.pit.k++;M.teamK++;}
    // 併殺：1アウトからでも成立する（打者アウト＋一塁走者アウトで回が終わるケースも含む）
    if(outcome==='OUT'&&old[0]&&outsBefore<=1&&Math.random()<0.45){M.outs++;M.bases[0]=null;sayAdd(outsBefore===1?'併殺打！ ダブルプレーでチェンジ！':'併殺打！ ダブルプレー！');}
  }else if(outcome==='BB'){
    // 四球：フォースになる走者だけ進塁（走者IDを保持。旧実装は打者のIDで上書きしていた）
    const r1=b[0],r2=b[1],r3=b[2],nb=[mark||true,null,null];
    if(r1&&r2&&r3){runs++;nb[1]=r1;nb[2]=r2;}
    else if(r1&&r2){nb[1]=r1;nb[2]=r2;}
    else if(r1){nb[1]=r1;nb[2]=r3;}
    else{nb[1]=r2;nb[2]=r3;}
    M.bases=nb;
  }else if(outcome==='SAC'){
    // 送りバント：打者はアウト、全走者が1つ進塁（三塁走者は生還）
    M.outs++;if(old[2])runs++;M.bases=[null,b[0]||null,b[1]||null];
  }else{
    const hits={'1B':1,'2B':2,'3B':3,'HR':4}[outcome];
    if(isMe)recPA(batter.id,r=>{r.ab++;r.h++;if(outcome==='HR')r.hr++;});
    if(outcome==='1B'){runs=(old[2]?1:0);const secondScores=old[1]&&Math.random()<0.72;if(secondScores)runs++;M.bases=[mark||true,old[0]?b[0]:null,(old[1]&&!secondScores)?b[1]:null];if(old[1]&&!secondScores)sayAdd('二塁走者は三塁でストップ。');}
    else if(outcome==='2B'){runs=(old[1]?1:0)+(old[2]?1:0);const firstScores=old[0]&&(isMe?batter.run>=48:Math.random()<0.7);if(firstScores)runs++;M.bases=[null,mark||true,old[0]&&!firstScores?b[0]:null];}
    else if(outcome==='3B'){runs=old.filter(Boolean).length;M.bases=[null,null,mark||true];}
    else if(outcome==='HR'){runs=old.filter(Boolean).length+1;M.bases=[null,null,null];}
    if(isMe){M.teamHits++;S.career.hits++;if(outcome==='HR'){M.teamHr++;S.career.hr++;}
      const gs=M.gameStats[batter.id]=M.gameStats[batter.id]||{h:0,hr:0,rbi:0,k:0};gs.h++;if(outcome==='HR')gs.hr++;}
    else M.cpuHits=(M.cpuHits||0)+1;
  }
  if(outcome!=='K'&&outcome!=='OUT'&&outcome!=='BB'&&outcome!=='SAC'&&isMe)recPA(batter.id,r=>{r.rbi+=runs;});
  if(isMe&&runs>0){const gs2=M.gameStats[batter.id]=M.gameStats[batter.id]||{h:0,hr:0,rbi:0,k:0};gs2.rbi+=runs;}
  if(outcome==='BB'&&isMe)recPA(batter.id,r=>{});
  if(isMe)M.score.me+=runs;else{M.score.cpu+=runs;M.pit.er+=runs;M.teamEr=(M.teamEr||0)+runs;}
  if(runs>0&&M.lines){const arr=isMe?M.lines.me:M.lines.cpu;arr[M.inning-1]=(arr[M.inning-1]||0)+runs;}
  if(runs>0)sayAdd('🎉 '+runs+'点入った！ スコア '+M.score.cpu+' - '+M.score.me);
  updateRunners3D();updateSB();
  return runs;
}
function sayAdd(t){say($('commentary').innerHTML+'<br>'+t);}
function paEnd(){
  M.balls=0;M.strikes=0;
  if(M.half==='top')M.ci++;else M.li++;
  if(checkGameEnd())return;
  if(M.outs>=3){endHalf();return;}
  updateSB();M.busy=false;setTimeout(nextPA,650);
}
function checkGameEnd(){
  if(!M||M.finished)return false;
  const last=M.maxInn;
  // 表終了時点で裏チーム（自分）リードなら最終回裏なし
  if(M.half==='top'&&M.outs>=3&&M.inning>=last&&M.score.me>M.score.cpu){finishMatch();return true;}
  // 最終回裏でリードしたらサヨナラ
  if(M.half==='bottom'&&M.inning>=last&&M.score.me>M.score.cpu){banner('サヨナラ！！');finishMatch();return true;}
  if(M.half==='bottom'&&M.outs>=3&&M.inning>=last&&M.score.me!==M.score.cpu){finishMatch();return true;}
  if(M.inning>last+3){finishMatch();return true;} // 延長上限(12回相当)
  return false;
}
function endHalf(){
  if(M.half==='top')M.pit.outs+=3;
  M.outs=0;M.bases=[null,null,null];updateRunners3D();
  if(M.half==='top'){M.half='bottom';say('実況：チェンジ！ '+M.inning+'回裏、ドリームスターズの攻撃！');}
  else{M.half='top';M.inning++;say('実況：チェンジ！ '+M.inning+'回表、守りの時間だ。');}
  buildStadium();updateSB();
  if(checkGameEnd())return;
  M.busy=false;setTimeout(nextPA,900);
}
function refreshBatterMesh(){
  if(!scene||!M)return;
  if(P3.batter){scene.remove(P3.batter);allPlayers3D=allPlayers3D.filter(g=>g!==P3.batter);} // 配列からも除去（残り続けると毎打席リークする）
  const cpuCol=(M.oppDef)?M.oppDef.color:0xd63b3b;
  const batCol=(M.half==='top')?cpuCol:0x1858e0;
  const person=(M.half==='top')?curCpuBatter():curMyBatter();
  P3.batter=makePlayer(batCol,batCol,true,person);
  P3.batter.position.set(BASE_POS.batter[0],BASE_POS.batter[1],BASE_POS.batter[2]);
  P3.batter.rotation.y=Math.PI+(nameHash(person.name||'x')%3-1)*0.16; // 打者ごとに構えが違う
  scene.add(P3.batter);
}
function stealInfoHtml(){ // 盗塁可能な場面だけ、リードランナーの成功率目安を打者カードに出す
  if(!M||M.half!=='bottom'||M.finished)return '';
  let rid=null;if(M.bases[1]&&!M.bases[2])rid=M.bases[1];else if(M.bases[0]&&!M.bases[1])rid=M.bases[0];
  if(rid==null)return '';
  const runner=(typeof rid==='number')?S.players.find(p=>p.id===rid):null;
  const spd=runner?runner.run:55;
  const pc=Math.round(clamp(0.45+(spd-50)*0.006,0.30,0.85)*100);
  return '<br>💨 盗塁成功率の目安：約'+pc+'%'+(runner?'（'+runner.name+' 走力'+spd+'）':'');
}
function zoneHtml(t){
  if(!t)return'';
  const left=clamp(50+t.tx*38,4,96), top=clamp((1-(t.ty-0.35)/1.85)*100,4,96);
  return '<div class="zone"><i style="left:'+left+'%;top:'+top+'%"></i></div>';
}
function nextPA(){
  if(!M||M.finished)return;
  M.balls=0;M.strikes=0;M.busy=false;M._hrReplay=false;updateSB();resetFielders();refreshBatterMesh();
  if(M.inning===7&&M.half==='bottom'&&M.maxInn>=7&&!M._balloon){M._balloon=true;setTimeout(()=>{releaseBalloons();banner('🎈 ラッキー7！ 黄色いジェット風船！');},600);}
  if(M.inning===5&&M.half==='bottom'&&!M._wave){M._wave=true;setTimeout(crowdWave,400);}
  if(M.inning===M.maxInn&&M.half==='bottom'&&!M._charge){M._charge=true;sfx('charge');}
  const tbKey=M.inning+'-'+M.half; // タイブレークは表・裏それぞれに二塁走者を置く（旧実装は裏に出なかった）
  if(M.inning>M.maxInn&&M._tbKey!==tbKey){M._tbKey=tbKey;if(M.bases.every(b=>!b)){M.bases=[null,true,null];updateRunners3D();updateSB();say('実況：延長タイブレーク！ 無死二塁から開始だ！');banner('⚡ タイブレーク');}}
  if(M.half==='bottom'){
    const bt=curMyBatter();
    showTelop('<img src="'+drawPortrait(bt.team?bt:Object.assign({},bt,{team:'スターズ'}))+'"><div><div class="tt-name">'+((M.li%M.lineup.length)+1)+'番 '+bt.name+'</div><div class="tt-sub">'+bt.pos+'｜ミート'+bt.meet+' パワー'+bt.pow+' 走'+bt.run+(bt.real?'｜'+bt.team:'')+'</div></div>',1650);
    $('batter-card').innerHTML='<img class="portrait-s" src="'+drawPortrait(bt.team?bt:Object.assign({},bt,{team:'スターズ'}))+'">打者：<b>'+bt.name+'</b>（'+bt.pos+'）'+((bt.form>=2)?' 🔥絶好調':(bt.form<=-2)?' ❄絶不調':'')+'<br>ミート'+bt.meet+' パワー'+bt.pow+' Lv'+bt.lv+'<br>今季：打率 '+avgText(bt)+' 本'+bt.ss.hr+' 打点'+bt.ss.rbi+(bt.skill?'<br><span class="rare">特技：'+bt.skill+'</span>':'')+stealInfoHtml();
    $('batter-card').classList.remove('hidden');$('pitch-controls').classList.add('hidden');$('bat-controls').classList.remove('hidden');
    $('btn-swing').disabled=true;$('btn-take').disabled=true;$('btn-bunt').disabled=true;
    say('実況：打席には'+bt.name+'。'+pick(['さあ打ってくれ！','期待の大砲だ。','チャンスメイク頼む！','今日は当たっている。','ドームの歓声が大きい！','PayPayドームが揺れている！']));
    if(P3.batter){const bp=BASE_POS.batter;P3.batter.position.set(BASE_POS.onDeck[0],0,BASE_POS.onDeck[2]);
      addTween(0.8,pr=>{P3.batter.position.x=BASE_POS.onDeck[0]+(bp[0]-BASE_POS.onDeck[0])*pr;P3.batter.position.z=BASE_POS.onDeck[2]+(bp[2]-BASE_POS.onDeck[2])*pr;});} // ネクストから歩いて打席へ
    setCam('bat');setTimeout(startPitch,1000);
  }else{
    const cb=curCpuBatter();
    showTelop('<img src="'+drawPortrait(cb)+'"><div><div class="tt-name">'+cb.name+'</div><div class="tt-sub">'+(cb.real?cb.team+'｜':'')+'ミート'+cb.meet+' パワー'+cb.pow+'</div></div>',1200);
    $('batter-card').innerHTML='<img class="portrait-s" src="'+drawPortrait(cb)+'">相手打者：<b>'+cb.name+'</b>'+(cb.real?'（'+cb.team+'）':'')+'<br>ミート'+cb.meet+' パワー'+cb.pow+'｜相手チーム総合力 '+M.opp.str+'<br>投手：'+M.starter.name+'（球速'+Math.round(118+M.starter.vel*0.42)+'km/h / 球数'+(M.myPitches||0)+'）'+((M.myPitches||0)>85?'<br>🥵 うちの先発も限界近い…継投どきかも':'');
    $('bat-controls').classList.add('hidden');$('pitch-controls').classList.remove('hidden');
    say('実況：相手打者'+cb.name+'を、'+M.starter.name+'が抑えられるか。');
    setCam('pitch');renderPitchButtons();
  }
}

/* --- 演出ヘルパー（観客・歓声・追球・テロップ） --- */
function umpPunch(){if(!P3.ump)return;if(P3.ump.userData.glb){glbPlay(P3.ump,'Punch_Right',true);return;}if(P3.ump.userData.armR){const a=P3.ump.userData.armR;addTween(0.3,pr=>{a.rotation.x=-2.5*Math.sin(pr*Math.PI);},()=>{a.rotation.x=0;});}}
function crowdWave(){if(!crowdMeshes.length)return;window._crowdHold=performance.now()+2700;const dots=crowdMeshes.slice();
  addTween(2.6,p=>{dots.forEach((d,i)=>{d.position.y=d.userData.y0+Math.max(0,Math.sin(p*6.28-i*0.12))*0.5;});},()=>dots.forEach(d=>{d.position.y=d.userData.y0;}));}
function exciteCrowd(power){
  if(!crowdMeshes.length)return;window._crowdHold=performance.now()+1100;const dots=crowdMeshes.slice();
  addTween(0.95,p=>{const s=Math.sin(p*Math.PI);dots.forEach((d,i)=>{d.position.y=d.userData.y0+s*(0.22+(i%5)*0.1)*power;});},
   ()=>dots.forEach(d=>{d.position.y=d.userData.y0;}));
  swellCrowd(power>=0.8);
}
function dustPuff(x,y,z,n,big){ // 土煙：着地・踏み込み・走塁の足元に
  if(!scene)return;const tex=makeGlowTex(),items=[];n=n||6;
  for(let i=0;i<n;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xcbb28a,transparent:true,opacity:0.5,depthWrite:false}));
    sp.position.set(x+rf(-0.3,0.3),y+rf(0,0.15),z+rf(-0.3,0.3));const s=rf(0.3,0.6)*(big?1.6:1);sp.scale.set(s,s,1);scene.add(sp);
    items.push({sp,vx:rf(-0.5,0.5),vy:rf(0.4,0.9),vz:rf(-0.5,0.5)});}
  addTween(0.55,p=>{items.forEach(o=>{o.sp.position.x+=o.vx*0.02;o.sp.position.y+=o.vy*0.02;o.sp.position.z+=o.vz*0.02;const s=o.sp.scale.x+0.014;o.sp.scale.set(s,s,1);o.sp.material.opacity=0.5*(1-p);});},
   ()=>items.forEach(o=>scene.remove(o.sp)));
}
let crowdNodes=null;
function startCrowd(){
  if(crowdNodes)return;const c=ac();if(!c)return;
  const len=2*c.sampleRate,buf=c.createBuffer(1,len,c.sampleRate),ch=buf.getChannelData(0);let v=0;
  for(let i=0;i<len;i++){v=v*0.97+(Math.random()*2-1)*0.05;ch[i]=v*2.4;}
  const src=c.createBufferSource();src.buffer=buf;src.loop=true;
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=420;
  const g=c.createGain();g.gain.value=0.013*crowdMul();
  src.connect(f).connect(g).connect(c.destination);src.start();crowdNodes={src,gain:g};
}
function swellCrowd(big){
  if(!crowdNodes)return;const c=ac();if(!c)return;const g=crowdNodes.gain.gain,t=c.currentTime;
  g.cancelScheduledValues(t);g.setTargetAtTime((big?0.075:0.045)*crowdMul(),t,0.06);g.setTargetAtTime(0.013*crowdMul(),t+0.5,0.9);
}
function stopCrowd(){if(crowdNodes){try{crowdNodes.src.stop();}catch(e){}crowdNodes=null;}}
function resetFielders(){P3.fielders.forEach(f=>{if(f.userData.home)f.position.copy(f.userData.home);});}
function chaseBall(lx,lz,dur,isOut){
  let best=null,bd=1e9;
  P3.fielders.forEach(f=>{if(f===P3.catcher)return;const dx=f.position.x-lx,dz=f.position.z-lz,d=dx*dx+dz*dz;if(d<bd){bd=d;best=f;}});
  if(!best)return;
  const sx=best.position.x,sz=best.position.z,tx=isOut?lx:lx+rf(-2.5,2.5),tz=isOut?lz:lz+rf(-2,2);
  best.userData.running=true;let puffAcc=0;
  addTween(dur*0.96,p=>{best.position.x=sx+(tx-sx)*p;best.position.z=sz+(tz-sz)*p;puffAcc+=0.016;if(puffAcc>0.17){puffAcc=0;dustPuff(best.position.x,0.12,best.position.z,2);}},()=>{best.userData.running=false;});
}
function showTelop(html,ms){
  const t=$('intro-telop');t.innerHTML=html;t.classList.remove('hidden');
  t.style.animation='none';void t.offsetWidth;t.style.animation='';
  clearTimeout(t._h);t._h=setTimeout(()=>t.classList.add('hidden'),ms||1500);
}
function sparkBurst(n,spread){ // 火花：光る粒が重力で落ちながら消える
  if(!scene)return;n=n||14;spread=spread||1;const tex=makeGlowTex(),parts=[],cols=[0xffffff,0xffe97a,0xffb03a];
  for(let i=0;i<n;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:cols[i%3],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    sp.position.set(0.4,1.1,16.2);const s=rf(0.22,0.55);sp.scale.set(s,s,1);scene.add(sp);
    parts.push({sp,vx:rf(-2.6,2.6)*spread,vy:rf(0.6,3.4)*spread,vz:rf(-2.4,0.6),g:rf(3.5,5.5)});}
  addTween(0.5,p=>{parts.forEach(o=>{o.vy-=o.g*0.016;o.sp.position.x+=o.vx*0.016;o.sp.position.y+=o.vy*0.016;o.sp.position.z+=o.vz*0.016;o.sp.material.opacity=1-p*p;});},
   ()=>parts.forEach(o=>scene.remove(o.sp)));
}
function impactRing(big){ // 衝撃：閃光＋二重リング（内＝速い白、外＝金）
  if(!scene)return;const tex=makeGlowTex();
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:big?0xffd94d:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  fl.position.set(0.4,1.12,16.15);fl.scale.set(0.6,0.6,1);scene.add(fl);
  addTween(0.16,p=>{const s=0.6+p*(big?2.8:1.8);fl.scale.set(s,s,1);fl.material.opacity=0.95*(1-p);},()=>scene.remove(fl));
  [[0xffffff,0.28,big?2.8:2.0,0.95],[big?0xffd94d:0x9fd8ff,0.5,big?4.6:3.2,0.7]].forEach(cfg=>{
    const m=new THREE.Mesh(new THREE.RingGeometry(0.30,0.40,32),new THREE.MeshBasicMaterial({color:cfg[0],transparent:true,opacity:cfg[3],side:THREE.DoubleSide,depthWrite:false}));
    m.position.set(0.4,1.12,16.12);scene.add(m);
    addTween(cfg[1],p=>{const sc=0.4+p*cfg[2];m.scale.set(sc,sc,1);m.material.opacity=cfg[3]*(1-p);},()=>scene.remove(m));});
}
function swingArc(){ // バットの風切り弧
  if(!scene)return;
  const m=new THREE.Mesh(new THREE.RingGeometry(0.55,1.1,20,1,-0.4,2.3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false}));
  m.position.set(0.4,1.15,16.3);m.rotation.x=0.4;scene.add(m);
  addTween(0.16,p=>{m.rotation.z=-p*1.6;m.material.opacity=0.5*(1-p);const s=1+p*0.5;m.scale.set(s,s,1);},()=>scene.remove(m));
}
function impactFX(strength,perfect){
  freezeT=perfect?0.17:0.05+strength*0.07;               // ヒットストップ（当たった瞬間に時が止まる）
  shakeAmp=Math.max(shakeAmp,0.05+strength*0.15+(perfect?0.09:0)); // 画面シェイク
  fovPunch=Math.min(1,0.3+strength*0.7+(perfect?0.15:0)); // カメラが一瞬グッと寄る
  impactRing(perfect||strength>=0.9);
  sparkBurst(perfect?30:Math.round(8+strength*14),perfect?1.9:1.1+strength*0.5);
}
/* --- PayPayドーム名物：ラッキー7の風船・勝利の花火 --- */
function releaseBalloons(){
  if(!scene)return;const tex=makeGlowTex(),items=[];
  for(let i=0;i<38;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffd21f,transparent:true,opacity:0.95,depthWrite:false}));
    const a=rf(-1.1,1.1),r=rf(38,47);sp.position.set(Math.sin(a)*r,rf(3,7),-4-Math.cos(a)*r);sp.scale.set(1,1.25,1);
    sp.userData.ph=rf(0,6.3);scene.add(sp);items.push(sp);}
  addTween(5,p=>{items.forEach(sp=>{sp.position.y+=0.055+Math.sin(p*9+sp.userData.ph)*0.012;sp.position.x+=Math.sin(p*6+sp.userData.ph)*0.02;sp.material.opacity=0.95*(1-Math.max(0,p-0.75)*4);});},
   ()=>items.forEach(sp=>scene.remove(sp)));
  swellCrowd(true);
}
function particleBurst(cx,cy,cz,color){
  if(!scene)return;const tex=makeGlowTex(),items=[];
  for(let i=0;i<26;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color,transparent:true,depthWrite:false}));
    sp.position.set(cx,cy,cz);const th=rf(0,6.28),ph=rf(0,3.14),v=rf(2.5,6);
    sp.userData.v=[Math.sin(ph)*Math.cos(th)*v,Math.cos(ph)*v*0.8,Math.sin(ph)*Math.sin(th)*v];sp.scale.set(0.85,0.85,1);scene.add(sp);items.push(sp);}
  addTween(1.15,p=>{items.forEach(sp=>{sp.position.x+=sp.userData.v[0]*0.045;sp.position.y+=sp.userData.v[1]*0.045-0.045*p;sp.position.z+=sp.userData.v[2]*0.045;sp.material.opacity=1-p;});},
   ()=>items.forEach(sp=>scene.remove(sp)));
}
function launchFireworks(){
  const cols=[0xffd94d,0xff6b6b,0x6bc5ff,0x8aff8a,0xff9ff3];
  for(let i=0;i<5;i++)setTimeout(()=>{particleBurst(rf(-22,22),rf(23,32),rf(-26,-2),cols[i%5]);sfx('hr');},i*380);
}
/* --- プロスピA式ミートカーソル --- */
let cursorPos={x:0.5,y:0.5},cursorMoved=false;
function aimBonus(t){
  if(!cursorMoved)return 0;
  const txC=(cursorPos.x-0.5)*2*1.15, tyC=0.3+(1-cursorPos.y)*1.8;
  const d=Math.hypot(txC-t.tx,tyC-t.ty);
  return d<0.35?0.22:d<0.6?0.1:d>1.0?-0.16:0;
}
/* --- 攻撃：投球とスイング --- */
const PITCH_TYPES=[
 {k:'fast',label:'ストレート',spd:[138,158],brk:0,spin:11,late:1.7},
 {k:'slider',label:'スライダー',spd:[122,138],brk:0.9,spin:7,late:2.3},
 {k:'curve',label:'カーブ',spd:[105,122],brk:-1.1,spin:-8,late:1.5},
 {k:'fork',label:'フォーク',spd:[120,134],brk:0,drop:0.72,spin:4,late:1.7},
 {k:'shoot',label:'シュート',spd:[128,142],brk:-0.7,spin:9,late:2.0},
 {k:'cutter',label:'カットボール',spd:[128,142],brk:0.45,spin:10,late:2.6},
 {k:'sinker',label:'シンカー',spd:[126,140],brk:-0.55,drop:0.38,spin:8,late:2.2},
 {k:'split',label:'スプリット',spd:[124,138],brk:0.08,drop:0.88,spin:3,late:1.9},
 {k:'changeup',label:'チェンジアップ',spd:[106,120],brk:-0.35,drop:0.3,spin:6,late:1.6},
 {k:'knuckle',label:'ナックル',spd:[95,112],brk:0.15,spin:0.6,late:1.2,flutter:1},
];
const PITCH_COLORS={fast:0xffffff,slider:0x54e0ff,curve:0xffe97a,fork:0xff7ad9,shoot:0x9dff8a,cutter:0xff8c42,sinker:0x2ee6a8,split:0xb388ff,changeup:0x64b5f6,knuckle:0xe8e4da};
function pitchMotion(P,form,stretch,onRelease){
  // 本格投球モーション：構え→脚上げ→踏み込み→腕を振り抜いてリリース→フォロースルー
  if(!P||!P.userData.armR){if(onRelease)onRelease();return;}
  const armR=P.userData.armR,armL=P.userData.armL,legL=P.userData.legL,shinL=P.userData.shinL;
  const AF=P.userData.glb?-0.55:1; // 外部モデルはボーンのX軸の正負が逆なので、腕の振りを反転・縮小する
  const peak=[-2.5,-2.05,-1.35][form||0]; // オーバースロー/スリークォーター/サイド
  const lift=stretch?0.35:1.0;           // 走者がいればセットポジション（小さく速く）
  const bRX=P.rotation.x,bRY=P.rotation.y,bRZ=P.rotation.z,bY=P.position.y,bZ=P.position.z;
  P.userData.inMotion=true;
  setTimeout(()=>{if(P.userData.inMotion){armR.rotation.x=0;if(armL)armL.rotation.x=0;if(legL)legL.rotation.x=0;if(shinL)shinL.rotation.x=0;P.rotation.set(bRX,bRY,bRZ);P.position.y=bY;P.position.z=bZ;P.userData.inMotion=false;}},1700); // 打者のスイングでtweenが消えた場合の姿勢復旧
  if(form===2)P.rotation.z=bRZ+0.18;
  addTween(0.42*lift+0.12,p=>{const s=Math.sin(p*Math.PI*0.5); // 1) 脚上げと体のひねり
    if(legL)legL.rotation.x=-1.05*lift*s;if(shinL)shinL.rotation.x=1.15*lift*s;
    armR.rotation.x=AF*peak*0.55*s;if(armL)armL.rotation.x=AF*-0.7*s;
    P.rotation.y=bRY+0.38*s;P.position.y=bY-0.05*s;},
  ()=>{addTween(0.20,p=>{ // 2) 踏み込み＋腕をトップへ
     if(legL)legL.rotation.x=-1.05*lift*(1-p)-0.15*p;if(shinL)shinL.rotation.x=1.15*lift*(1-p);
     armR.rotation.x=AF*peak*(0.55+0.45*p);P.rotation.y=bRY+0.38*(1-p*1.6);P.position.z=bZ+0.55*p;P.position.y=bY-0.05+0.05*p;},
   ()=>{dustPuff(P.position.x,0.1,bZ+1.0,4); // 踏み込みの土煙
    addTween(0.09,p=>{armR.rotation.x=AF*(peak+(0.95-peak)*p);P.rotation.x=bRX+0.22*p;}, // 3) 振り抜き
    ()=>{if(onRelease)onRelease();
     addTween(0.38,p=>{armR.rotation.x=AF*(0.95-1.15*p);if(armL)armL.rotation.x=AF*(-0.7+0.55*p);P.rotation.x=bRX+0.22*(1-p*0.6);P.position.z=bZ+0.55*(1-p);}, // 4) フォロースルー
     ()=>{armR.rotation.x=0;if(armL)armL.rotation.x=0;if(legL)legL.rotation.x=0;if(shinL)shinL.rotation.x=0;P.rotation.set(bRX,bRY,bRZ);P.position.y=bY;P.position.z=bZ;P.userData.inMotion=false;});
    });});});
}
function startPitch(){
  if(!M||M.finished||M.half!=='bottom')return;
  M.busy=true;M.swungEarly=false;
  const pp=M.opp.pitcher;
  const type=(Math.random()<0.055)?PITCH_TYPES[9]:pick(PITCH_TYPES.slice(0,9)); // ナックルはたまに来る魔球
  const speed=Math.round(clamp(rf(type.spd[0],type.spd[1])+(pp.vel-60)*0.25,95,168));
  const inZone=Math.random()<0.68;
  const tx=inZone?rf(-0.5,0.5):rf(0.6,1.1)*(Math.random()<0.5?-1:1);
  const ty=inZone?rf(0.75,1.65):rf(0.3,2.1);
  const dur=clamp(1.55-(speed-100)*0.0055,0.95,1.5);
  M.pitch={type,speed,tx,ty,dur};M.oppPitches=(M.oppPitches||0)+1;M.flutterSeed=rf(0,6.28);
  if(P3.zoneFrame)P3.zoneFrame.visible=true;
  if(P3.targetRing){P3.targetRing.position.set(tx,ty,16.3);P3.targetRing.visible=true;}
  if(ballTrailLine)ballTrailLine.material.color.set(PITCH_COLORS[type.k]||0xffffff);
  // プロスピA式ミートカーソル：ボールの到達点に指で合わせる
  cursorPos={x:0.5,y:0.5};cursorMoved=false;
  $('cursor-ring').style.left='50%';$('cursor-ring').style.top='50%';
  $('cursor-zone').classList.remove('hidden');$('cursor-ball').classList.remove('hidden');
  $('pitch-info').innerHTML='⚾ '+M.opp.pitcher.name+'（球数'+M.oppPitches+'）<br>球速表示は打った後！'+(M.oppPitches>80?'<br>🥵 相手投手は疲れている！':'');
  $('pitch-coming').classList.remove('hidden');
  // 本格投球モーション（フォームは投手ごとに3種、走者がいればセットポジション）
  const tk=M.pitchToken||0;
  pitchMotion(P3.pitcher,nameHash(pp.name)%3,M.bases.some(b=>b),()=>{
    if(!M||M.finished||(M.pitchToken||0)!==tk)return;
    ballMesh.visible=true;M.ballLive=true;M.ballP=0;
    $('btn-swing').disabled=false;$('btn-take').disabled=false;$('btn-bunt').disabled=false;
    addTween(dur,p=>{
      M.ballP=p;
      const z=0.4+17*p, x=Math.sin(Math.pow(p,type.late||1.7)*Math.PI)*type.brk*0.85 + tx*p + (type.flutter?Math.sin(p*23+M.flutterSeed)*0.09*p:0); // 変化は球種ごとに遅れて鋭く、ナックルは揺れる
      let y=1.35+(ty-1.35)*p; if(type.drop)y-=Math.sin(Math.max(0,p-0.55)*Math.PI)*type.drop;
      ballMesh.position.set(x,y,z);ballMesh.rotation.x=p*(type.spin||10);ballMesh.rotation.z=type.brk*2*p;
      const bd=$('cursor-ball');bd.style.left=clamp(50+x*34,3,97)+'%';bd.style.top=clamp((1-(y-0.3)/1.8)*100,3,97)+'%';
    },()=>{ ballMesh.visible=false;M.ballLive=false;$('cursor-zone').classList.add('hidden');if(P3.zoneFrame)P3.zoneFrame.visible=false;if(P3.targetRing)P3.targetRing.visible=false;calledPitch(); });
  });
}
function calledPitch(){
  if(!M||M.finished)return;
  $('pitch-coming').classList.add('hidden');
  $('btn-swing').disabled=true;$('btn-take').disabled=true;$('btn-bunt').disabled=true;
  const t=M.pitch, inZone=Math.abs(t.tx)<=0.55&&t.ty>=0.7&&t.ty<=1.75;
  if(M.swungEarly){M.strikes++;sfx('whiff');say('実況：早振り空振り！ '+t.type.label+' '+t.speed+'km/h、ストライク！');if(M.strikes>=3)umpPunch();}
  else if(inZone||Math.random()<0.25){M.strikes++;sfx('catch');say('実況：見逃しストライク！ '+t.type.label+' '+t.speed+'km/h が決まった。');if(M.strikes>=3)umpPunch();}
  else{M.balls++;sfx('catch');say('実況：ボール。'+t.type.label+' '+t.speed+'km/h は外れた。');}
  $('pitch-info').innerHTML='前球：'+t.type.label+' '+t.speed+'km/h'+zoneHtml(t);
  if(t.speed>=150)showTelop('<div><div class="tt-name">⚡ '+t.speed+'km/h</div><div class="tt-sub">'+t.type.label+'（レーダーガン計測）</div></div>',800);
  afterPitchCount();
}
function afterPitchCount(){
  updateSB();
  if(M.strikes>=3){
    const bt=curMyBatter();recPA(bt.id,r=>{r.ab++;});
    sayAdd('三振…！ '+bt.name+'、悔しい見逃し/空振り三振。');sfx('out');
    M.outs++;paEnd();return;
  }
  if(M.balls>=4){sayAdd('フォアボール！ 出塁だ。');applyOutcome('me','BB');paEnd();return;}
  M.busy=false;setTimeout(startPitch,750);
}
function onSwing(){
  if(!M||M.finished||!M.ballLive)return;
  sfx('whiff');
  const z=0.4+17*M.ballP, dz=z-16.4;
  if(dz<-2.3){M.swungEarly=true;$('btn-swing').disabled=true;say('実況：早すぎるスイング！');return;}
  // バットが当たる処理へ（投球アニメを止める代わりにボールを引き継ぐ）
  M.ballLive=false;tweens.length=0;
  if(P3.batter){const b=P3.batter;if(b.userData.glb){glbPlay(b,'Sword_Slash',true);}else{addTween(0.07,p=>{b.rotation.y=Math.PI+p*0.35;},()=>{addTween(0.09,p=>{b.rotation.y=Math.PI+0.35-p*2.65;},()=>{addTween(0.24,p=>{b.rotation.y=Math.PI-2.3+p*2.3;});});});}}
  swingArc();
  resolveContact(dz);
}
function onTake(){
  if(!M||!M.ballLive)return;
  $('btn-swing').disabled=true;$('btn-take').disabled=true;$('btn-bunt').disabled=true;
  say('実況：見送った…');
}
function onBunt(){$('cursor-zone').classList.add('hidden');
  if(!M||!M.ballLive)return;
  const z=0.4+17*M.ballP;if(Math.abs(z-16.4)>2.6){toast('バントのタイミングが合わない！');return;}
  M.ballLive=false;tweens.length=0;ballMesh.visible=false;
  $('pitch-coming').classList.add('hidden');
  const bt=curMyBatter();const r=Math.random();
  if(r<0.18){if(M.strikes>=2){recPA(bt.id,x=>{x.ab++;});M.outs++;say('実況：バントはファウル…2ストライク後のバントファウルは三振！');sfx('out');paEnd();}else{M.strikes++;say('実況：バントはファウル。');afterPitchCount();}}
  else if(r<0.30){say('実況：バントが内野安打に！');applyOutcome('me','1B');paEnd();}
  else if(M.outs>=2){ // 2アウトでは送りバントは成立しない（打者アウト＝チェンジで得点も入らない）ため、バントヒット狙いとして扱う
    if(r<0.55){say('実況：2アウトからのバントヒット！ 意表を突いた！');applyOutcome('me','1B');paEnd();}
    else{recPA(bt.id,x=>{x.ab++;});M.outs++;say('実況：バント失敗…2アウトでは送れない（打者アウト）。');sfx('out');paEnd();}}
  else{say('実況：きれいな送りバント！');recPA(bt.id,x=>{});applyOutcome('me','SAC');paEnd();}
}
function resolveContact(dz){
  $('pitch-coming').classList.add('hidden');
  $('cursor-zone').classList.add('hidden');
  if(P3.zoneFrame)P3.zoneFrame.visible=false;if(P3.targetRing)P3.targetRing.visible=false;
  $('btn-swing').disabled=true;$('btn-take').disabled=true;$('btn-bunt').disabled=true;
  const bt=curMyBatter(),t=M.pitch;
  const q=clamp(1-Math.abs(dz)/2.4,0,1);
  const perfect=Math.abs(dz)<=0.55;
  const ab=aimBonus(t);
  let contactP=0.30+(bt.meet-55)*0.005+q*0.38-(t.type.brk!==0||t.type.drop?0.05:0)+ab+((M.oppPitches||0)>80?0.04:0)+((bt.form||0)*0.008); // 相手投手の疲労と打者の調子
  if(bt.skill==='神の目')contactP+=0.06;
  if(ab>=0.2)say('実況：ミートカーソルばっちり！ 芯で捉えた！');
  if(Math.random()>contactP){
    if(q>0.42&&Math.random()<0.45){ // ファウル
      if(M.strikes<2)M.strikes++;
      say('実況：ファウル！ あと少しだった。'+t.type.label+' '+t.speed+'km/h');sfx('bat');shakeAmp=Math.max(shakeAmp,0.05);impactRing(false);
      updateSB();M.busy=false;setTimeout(startPitch,700);return;
    }
    M.strikes++;sfx('whiff');say('実況：空振り！ '+t.type.label+' '+t.speed+'km/h にバットが回る。');
    $('pitch-info').innerHTML='前球：'+t.type.label+' '+t.speed+'km/h'+zoneHtml(t);
    afterPitchCount();return;
  }
  // 当たった！
  sfx('bat');vib('0,25');if(perfect){flash();banner('ジャストミート！');sparkBurst();sfx('metal');}
  const dir=dz<-0.5?rf(-1.0,-0.55):dz>0.5?rf(0.55,1.0):rf(-0.3,0.3);
  let hitQ=q*30+(bt.meet+bt.pow-110)*0.18+rf(0,26)+(bt.skill==='パワーヒッター'?5:0)+(bt.skill==='安打製造機'?4:0)+(perfect?6:0)+(ab>=0.2?9:ab>0?4:ab<0?-5:0);
  let outcome;const hx=Math.random();
  if(hitQ<33)outcome='OUT';
  else if(hitQ<45)outcome=hx<0.38?'1B':'OUT';
  else if(hitQ<55)outcome=hx<0.50?'1B':hx<0.68?'2B':'OUT';
  else if(hitQ<65)outcome=hx<0.30?'1B':hx<0.64?'2B':hx<0.86?'HR':hx<0.92?'3B':'OUT';
  else outcome=hx<0.48?'HR':hx<0.78?'2B':hx<0.86?'3B':'1B';
  const dist=outcome==='HR'?rf(37,44):outcome==='OUT'?rf(14,30):outcome==='1B'?rf(10,20):rf(26,36);
  impactFX(outcome==='HR'?1:outcome==='OUT'?0.25:0.55,perfect);
  if(outcome==='2B'||outcome==='3B'||outcome==='HR')slowT=0.42; // 長打は打球がゆっくり伸びる
  if(perfect||outcome==='HR')sfx('crack');
  const lx=Math.sin(dir)*dist, lz=16.4-Math.cos(dir)*dist;
  chaseBall(lx,lz,0.85,outcome==='OUT');
  if(ballTrailLine)ballTrailLine.material.color.set(outcome==='HR'?0xffd94d:0xffffff);
  if(M.half==='bottom'&&M.inning>=M.maxInn&&M.score.me===M.score.cpu)slowmo=0.5; // サヨナラの場面はスローモーション
  setCam('follow');ballMesh.visible=true;
  const finishHit=()=>{
     ballMesh.visible=false;setCam('bat');slowmo=1;dustPuff(lx,0.15,lz,outcome==='OUT'?8:5,outcome!=='OUT');
     if(outcome==='HR'){banner('ホームラン！！');sfx('hr');vib('0,70,50,150');exciteCrowd(1);S.fans+=15;
       particleBurst(lx,4,lz,0xffd94d);setTimeout(()=>particleBurst(lx+rf(-3,3),6,lz+rf(-2,2),0xff9ff3),260);setTimeout(()=>particleBurst(lx+rf(-4,4),5,lz,0x6bc5ff),520);
       showTelop('<div><div class="tt-name">💥 ホームラン！</div><div class="tt-sub">'+bt.name+' — 推定飛距離'+Math.round(dist*3)+'m！ '+t.type.label+' '+t.speed+'km/h を完璧に捉えた！</div></div>',2300);
       drawBoard('ホームラン！',bt.name);setTimeout(()=>drawBoard('⚾⚾⚾',bt.name),450);setTimeout(()=>drawBoard('ホームラン！',bt.name+' おめでとう！'),900);}
     else if(outcome==='OUT'){sfx('out');}
     else{sfx('hit');exciteCrowd(0.35);}
     const lines={'1B':'ヒット！ '+bt.name+'が打ち返した！','2B':'ツーベース！ 打球が外野を破った！','3B':'スリーベース！ 長打炸裂！','HR':'ホームラン！！！ '+bt.name+'の完璧な一発がスタンドへ！','OUT':'打球が上がったが…野手のグラブへ。アウト。'};
     const flavor=(outcome==='OUT'||outcome==='HR')?'':(hitQ>=62?'芯を食った鋭い打球！ ':(hitQ<40?'詰まったが野手のいない所へ！ ':'')); // 打球の質で実況を分岐
     say('実況：'+flavor+lines[outcome]+'（'+t.type.label+' '+t.speed+'km/h）');
     if(outcome==='OUT'){M.outs++;recPA(bt.id,r=>{r.ab++;});}
     else applyOutcome('me',outcome);
     updateSB();
     if(checkGameEnd())return;
     paEnd();
  };
  addTween(0.85,p=>{let by=1.2+Math.sin(p*Math.PI)*(outcome==='1B'||outcome==='OUT'?3.5:9);
     if(outcome==='1B'&&p>0.62)by=Math.max(0.16,Math.abs(Math.sin((p-0.62)*16))*1.1*(1-p)+0.14); // 人工芝で弾む
     ballMesh.position.set(lx*p,by,16.4+(lz-16.4)*p);},
   ()=>{
     if(outcome==='HR'&&!M._hrReplay){M._hrReplay=true;banner('📺 リプレイ');sfx('cheer');setCam('follow');ballMesh.visible=true;
       addTween(1.5,p=>{ballMesh.position.set(lx*p,1.2+Math.sin(p*Math.PI)*9,16.4+(lz-16.4)*p);},()=>{ballMesh.visible=false;finishHit();});return;}
     finishHit();
   });
}
function onSteal(){
  if(!M||M.finished)return;
  if(M.half!=='bottom'){toast('盗塁は攻撃の時だけだよ');return;}
  if(M.ballLive||M.busy){toast('投球中は盗塁できない（次の投球前に押してね）');return;} // 投球モーション中は走らない（状態のねじれ防止）。無反応にせず理由を出す
  // リードランナー：三塁が空いていれば二塁走者、二塁が空いていれば一塁走者が走る
  let from=-1;
  if(M.bases[1]&&!M.bases[2])from=1;else if(M.bases[0]&&!M.bases[1])from=0;
  if(from<0){toast('盗塁できる走者がいない（進塁先が詰まっている）');return;}
  const rid=M.bases[from];
  const runner=(typeof rid==='number')?S.players.find(p=>p.id===rid):null;
  const spd=runner?runner.run:55;
  const pSucc=clamp(0.45+(spd-50)*0.006,0.30,0.85);
  M.bases[from]=null;
  if(Math.random()<pSucc){
    M.bases[from+1]=rid;if(runner)runner.ss.sb=(runner.ss.sb||0)+1;
    say('実況：走った！ 盗塁成功！ '+(runner?runner.name+'（走力'+spd+'）':'走者')+'が'+(from+2)+'塁へ！');sfx('hit');vib('0,30');
  }else{
    M.outs++;say('実況：盗塁失敗…タッチアウト！ あと少しだった。');sfx('out');
  }
  updateRunners3D();updateSB();
  if(M.outs>=3){ // 盗塁死で回終了（打席は未完のまま次回に持ち越し＝打順は進めない）
    if(checkGameEnd())return;
    M.balls=0;M.strikes=0;endHalf();
  }
}
function flushPitcherStats(){
  // 継投時：ここまでの投手成績を降板投手へ精算する
  const st=M&&M.starter;if(!st)return;
  st.ss.ip+=M.pit.outs;st.ss.k+=M.pit.k;st.ss.er+=M.pit.er;
  M.pit={outs:0,k:0,er:0};
}
function reliefPitch(){
  if(!M||M.finished||M.half!=='top')return;
  if(M.ballLive||M.busy||meterActive){toast('投球中は継投できない（投球の合間に押してね）');return;}
  if((M.relieved||0)>=2){toast('継投は1試合2回まで');return;}
  const used=new Set([M.starter.id].concat(M._usedPitchers||[]));
  const cand=S.players.filter(p=>p.kind==='P'&&!(p.inj>0)&&!used.has(p.id)).sort((a,b)=>overall(b)-overall(a))[0];
  if(!cand){toast('代われる投手がいない（控え投手不足）');return;}
  flushPitcherStats();
  M._usedPitchers=(M._usedPitchers||[]).concat([M.starter.id]);
  const oldName=M.starter.name;
  M.starter=cand;M.myPitches=0;M.relieved=(M.relieved||0)+1;
  say('実況：投手交代！ '+oldName+' に代わって '+cand.name+' がマウンドへ！ フレッシュな腕に託す！');
  toast('🔄 継投：'+cand.name+' 登板');sfx('level');vib('0,30');
  buildStadium();renderPitchButtons();updateSB();save();
}
function pinchHit(){
  if(!M||M.finished||M.half!=='bottom')return;
  if(M.pinchUsed){toast('代打は1試合1回まで');return;}
  if(M.ballLive){toast('投球中は代打できない（次の投球前に押してね）');return;}
  const cur=curMyBatter();
  const bench=S.players.filter(pl=>pl.kind==='B'&&!pl.retired&&!(pl.inj>0)&&!M.lineup.includes(pl))
    .sort((a,b)=>(b.meet+b.pow)-(a.meet+a.pow))[0];
  if(!bench){toast('使える代打がいない');return;}
  if(bench.meet+bench.pow<=cur.meet+cur.pow+4){toast('代打より現打者が上だ（温存）');return;}
  const idx=M.lineup.indexOf(cur);M.lineup[idx]=bench;M.pinchUsed=true;
  toast('代打！ '+bench.name+' が打席へ');say('実況：ここで代打、'+bench.name+'！ 勝負に出た！');
  refreshBatterMesh();nextPARefreshCard();vib('0,30');
}
function nextPARefreshCard(){const bt=curMyBatter();
  $('batter-card').innerHTML='<img class="portrait-s" src="'+drawPortrait(bt.team?bt:Object.assign({},bt,{team:'スターズ'}))+'">打者：<b>'+bt.name+'</b>（'+bt.pos+'）'+((bt.form>=2)?' 🔥絶好調':(bt.form<=-2)?' ❄絶不調':'')+'<br>ミート'+bt.meet+' パワー'+bt.pow+' Lv'+bt.lv+'<br>今季：打率 '+avgText(bt)+' 本'+bt.ss.hr+' 打点'+bt.ss.rbi+(bt.skill?'<br><span class="rare">特技：'+bt.skill+'</span>':'')+stealInfoHtml();
  updateSB(); // 代打交代直後に盗塁ボタンの可否も新しい走者/打順で同期する
}
/* --- 守備：投球 --- */
let meterPos=0,meterActive=false,meterT0=0,selPitch='fast';
function tickMeter(now){
  if(!meterActive)return;
  const ph=((now-meterT0)%1100)/1100; meterPos=ph<0.5?ph*200:(1-ph)*200;
  const n=$('meter-needle');if(n){n.style.left=meterPos+'%';const inGold=Math.abs(meterPos-50)<=7;n.style.background=inGold?'#ffd94d':'#ff3b30';n.style.boxShadow=inGold?'0 0 12px rgba(255,217,77,.95)':'0 0 8px rgba(255,59,48,.9)';} // 金ゾーン内では針が金色に光る
}
function myPitches(){
  const p=M.starter;const list=[{k:'fast',label:'ストレート '+Math.round(118+p.vel*0.42)+'km'}];
  if(p.brk>=34)list.push({k:'changeup',label:'チェンジアップ'});
  if(p.brk>=40)list.push({k:'curve',label:'カーブ'});
  if(p.brk>=46)list.push({k:'cutter',label:'カットボール'});
  if(p.brk>=52)list.push({k:'slider',label:'スライダー'});
  if(p.brk>=58)list.push({k:'sinker',label:'シンカー'});
  if(p.brk>=64)list.push({k:'fork',label:'フォーク'});
  if(p.brk>=70)list.push({k:'split',label:'スプリット'});
  if(p.brk>=78)list.push({k:'knuckle',label:'ナックル'});
  if(p.vel>=68)list.push({k:'shoot',label:'シュート'});
  if(p.skill==='変化球の鬼'&&!list.find(x=>x.k==='fork'))list.push({k:'fork',label:'フォーク(特技)'});
  return list;
}
function renderPitchButtons(){
  const list=myPitches();if(!list.find(x=>x.k===selPitch))selPitch='fast';
  $('pitch-select').innerHTML=list.map(x=>'<button class="pitch-btn '+(x.k===selPitch?'sel':'')+'" onclick="choosePitch(\''+x.k+'\')">'+x.label+'</button>').join('');
  $('meter-wrap').classList.add('hidden');$('btn-throw').classList.add('hidden');
}
function choosePitch(k){
  selPitch=k;renderPitchButtons();
  const pt=PITCH_TYPES.find(x=>x.k===k);
  if(pt)$('pitch-info').innerHTML='球種：'+pt.label+'（'+pt.spd[0]+'〜'+pt.spd[1]+'km/h）'+(pt.flutter?' ふらふら揺れる魔球':pt.drop?' 鋭く落ちる':pt.brk?' 大きく曲がる':pt.k==='fast'?' 真っ向勝負':' 小さく鋭く曲がる'); // 選んだ球種の情報を出す
  $('meter-wrap').classList.remove('hidden');$('btn-throw').classList.remove('hidden');
  meterActive=true;meterT0=performance.now();
}
function onThrow(){
  if(!meterActive||!M||M.finished)return;
  meterActive=false;M.busy=true;
  $('btn-throw').disabled=true;
  const dist=Math.abs(meterPos-50);
  const quality=dist<=7?'perfect':dist<=17?'good':dist<=30?'ok':'bad';
  if(quality==='perfect'){banner('完璧な1球！');flash();}
  const p=M.starter;
  const tx=quality==='bad'?rf(-1,1):rf(-0.45,0.45), ty=quality==='bad'?rf(0.4,2):rf(0.75,1.65);
  M._lastZone={tx,ty};
  const pt=PITCH_TYPES.find(x=>x.k===selPitch)||PITCH_TYPES[0];
  setCam('pitch');
  pitchMotion(P3.pitcher,nameHash(p.name)%3,M.bases.some(b=>b),()=>{
    if(!M||M.finished)return;
    ballMesh.visible=true;
    addTween(0.55,pr=>{
      const bx=Math.sin(Math.pow(pr,pt.late||1.7)*Math.PI)*(pt.brk||0)*0.85+tx*pr+(pt.flutter?Math.sin(pr*23+1.7)*0.09*pr:0);
      let by=1.35+(ty-1.35)*pr; if(pt.drop)by-=Math.sin(Math.max(0,pr-0.55)*Math.PI)*pt.drop;
      ballMesh.position.set(bx,by,0.4+16.6*pr);ballMesh.rotation.x=pr*(pt.spin||10);ballMesh.rotation.z=(pt.brk||0)*2*pr;
    },()=>{
      ballMesh.visible=false;$('btn-throw').disabled=false;
      resolveCpuPitch(quality);
    });
  });
}
function resolveCpuPitch(quality){
  $('pitch-info').innerHTML='あなたの投球（'+selPitch+'）'+(M._lastZone?zoneHtml(M._lastZone):'');
  const cb=curCpuBatter(),p=M.starter;
  const diff=(overall(cb)-overall(p))*0.004;
  M.myPitches++;
  let contactP={perfect:0.22,good:0.31,ok:0.39,bad:0.49}[quality]+diff+((M.myPitches>85)?0.05:0)-((p.form||0)*0.006); // 球数疲労と調子
  if(selPitch==='knuckle'||selPitch==='split')contactP-=0.04;else if(selPitch==='changeup'||selPitch==='sinker')contactP-=0.03;else if(selPitch==='fast')contactP+=0.01; // 球種の打ちにくさ
  let strikeP={perfect:0.47,good:0.36,ok:0.28,bad:0.18}[quality]-diff*0.5;
  const r=Math.random();
  if(r<contactP){
    if(Math.random()<0.32){ // ファウル
      if(M.strikes<2)M.strikes++;say('実況：ファウルで粘る相手打者。');updateSB();M.busy=false;renderPitchButtons();return;
    }
    // 打たれた
    let outcome;const hrP=clamp((cb.pow-55)*0.004+(quality==='bad'?0.09:0),0.01,0.22);
    const x=Math.random();
    if(x<hrP)outcome='HR';else if(x<hrP+0.10)outcome='2B';else if(x<hrP+0.12)outcome='3B';else if(x<hrP+0.32)outcome='1B';else outcome='OUT';
    setCam('follow');
    const dir=rf(-0.9,0.9),dist=outcome==='HR'?40:rf(16,34);
    chaseBall(Math.sin(dir)*dist,16.4-Math.cos(dir)*dist,0.8,outcome==='OUT');
    ballMesh.visible=true;
    addTween(0.8,pr=>{ballMesh.position.set(Math.sin(dir)*dist*pr,1.2+Math.sin(pr*Math.PI)*7,16.4-Math.cos(dir)*dist*pr);},()=>{
      ballMesh.visible=false;setCam('pitch');
      if(outcome==='HR'){banner('打たれた…ホームラン');sfx('out');}
      else if(outcome==='OUT'){sfx('catch');say('実況：打ち取った！ '+cb.name+'を凡退！');M.outs++;}
      else{sfx('hit');say('実況：打たれた、'+(outcome==='1B'?'ヒット':outcome==='2B'?'ツーベース':'スリーベース')+'。');}
      if(outcome!=='OUT')applyOutcome('cpu',outcome);
      updateSB();if(checkGameEnd())return;paEnd();
    });
    return;
  }
  if(r<contactP+strikeP){
    M.strikes++;sfx('whiff');
    if(M.strikes>=3){say('実況：三振！！ '+p.name+'が吠えた！');M.pit.k++;M.teamK++;S.career.ks++;M.outs++;banner('三振！');vib('0,40,30,40');umpPunch();exciteCrowd(0.5);{const gsk=M.gameStats[p.id]=M.gameStats[p.id]||{h:0,hr:0,rbi:0,k:0};gsk.k++;}updateSB();paEnd();return;}
    say('実況：ストライク！ 相手は手が出ない。');updateSB();M.busy=false;renderPitchButtons();return;
  }
  M.balls++;sfx('catch');
  if(M.balls>=4){say('実況：フォアボールを与えた…');applyOutcome('cpu','BB');updateSB();paEnd();return;}
  say('実況：ボール。際どいコースを外した。');updateSB();M.busy=false;renderPitchButtons();
}
function hidePitchUI(){ // シミュ/試合終了時に投球中UI（カーソルゾーン・投球中表示・ゾーン枠）を残さない
  $('pitch-coming').classList.add('hidden');$('cursor-zone').classList.add('hidden');
  if(P3.zoneFrame)P3.zoneFrame.visible=false;if(P3.targetRing)P3.targetRing.visible=false;
}
/* --- シミュレーション --- */
function simOutcomePA(side){
  // 1打席分を確率だけで解決（配分：アウト約66% / 四球7% / 単打17% / 二塁打4.5% / 三塁打0.5% / 本塁打 約5%）
  // 旧配分は残り全部が本塁打で、力差が開くと1試合18失点級の大味な試合になっていた
  let outcome;const x=Math.random();
  const adv=side==='me'?((overall(curMyBatter())-M.opp.pitcher.ctl)*0.004):((overall(M.starter)-overall(curCpuBatter()))*0.004);
  const outP=clamp(0.66-adv,0.56,0.76);
  const hrP=clamp(1-outP-0.29,0.02,0.08); // 本塁打は最大でも8%に抑え、余りは単打へ回す
  const b1P=Math.max(0.05,(1-outP)-0.07-0.045-0.005-hrP); // 単打＝残り（四球7%・二塁打4.5%・三塁打0.5%・本塁打hrPを引いた分）
  let cum=outP;
  if(x<cum)outcome=Math.random()<0.24?'K':'OUT';
  else if(x<(cum+=0.07))outcome='BB';
  else if(x<(cum+=b1P))outcome='1B';
  else if(x<(cum+=0.045))outcome='2B';
  else if(x<(cum+=0.005))outcome='3B';
  else outcome='HR';
  if(side==='me'){
    const bt=curMyBatter();
    if(outcome==='K'||outcome==='OUT')recPA(bt.id,r=>{r.ab++;});
    else applyOutcomeSim('me',outcome);
    if(outcome==='K'||outcome==='OUT'){/* outs already? applyOutcomeSim handles hits only */}
  }else{
    if(outcome==='K'){M.pit.k++;M.teamK++;S.career.ks++;}
    if(outcome==='K'||outcome==='OUT')M.outs++;
    else applyOutcomeSim('cpu',outcome);
  }
  if(side==='me'&&(outcome==='K'||outcome==='OUT'))M.outs++;
  if(side==='me')M.li++;else M.ci++;
}
function applyOutcomeSim(side,outcome){ // applyOutcomeは打者index前提なので、indexを進める前に呼ぶ専用
  const runsBefore=side==='me'?M.score.me:M.score.cpu;
  applyOutcome(side,outcome);
  return (side==='me'?M.score.me:M.score.cpu)-runsBefore;
}
function simHalf(){
  if(!M||M.finished||M.busy)return;
  M.pitchToken=(M.pitchToken||0)+1;
  tweens.length=0;M.ballLive=false;ballMesh.visible=false;hidePitchUI();
  const targetHalf=M.half,targetInn=M.inning;let guard=0;
  while(!M.finished&&M.half===targetHalf&&M.inning===targetInn&&guard++<60){
    M.balls=0;M.strikes=0;simOutcomePA(M.half==='top'?'cpu':'me');
    if(M.outs>=3){M.outs=0;M.bases=[null,null,null];
      if(M.half==='top'){M.pit.outs+=3;M.half='bottom';}else{M.half='top';M.inning++;}
      break;}
    if(checkGameEnd())break;
  }
  updateRunners3D();buildStadium();updateSB();
  say('実況：シミュレーションで回が進んだ。スコア '+M.score.cpu+' - '+M.score.me);
  if(!M.finished){M.busy=false;setTimeout(nextPA,500);}
}
function simGame(){
  if(!M||M.finished)return;
  M.pitchToken=(M.pitchToken||0)+1;M.busy=false;
  tweens.length=0;M.ballLive=false;ballMesh.visible=false;hidePitchUI();
  let guard=0;
  while(!M.finished&&guard++<400){
    M.balls=0;M.strikes=0;simOutcomePA(M.half==='top'?'cpu':'me');
    if(M.outs>=3){M.outs=0;M.bases=[null,null,null];
      if(M.half==='top'){M.pit.outs+=3;M.half='bottom';}else{M.half='top';M.inning++;}
      if(checkGameEnd())break;}
    if(checkGameEnd())break;
  }
}

/* --- 試合終了・シーズン進行 --- */
function finishMatch(){
  if(!M||M.finished)return;M.finished=true;meterActive=false;stopCrowd();hidePitchUI();
  $('bat-controls').classList.add('hidden');$('pitch-controls').classList.add('hidden');
  const win=M.score.me>M.score.cpu, draw=M.score.me===M.score.cpu;
  if(win)S._fireworks=true;
  const innPlayed=M.maxInn;
  // 選手スタッツ反映
  Object.keys(M.pa).forEach(id=>{const p=S.players.find(x=>x.id==id);if(!p)return;const r=M.pa[id];p.ss.ab+=r.ab;p.ss.h+=r.h;p.ss.hr+=r.hr;p.ss.rbi+=r.rbi;});
  if(M.half==='top')M.pit.outs+=M.outs; // 終了時点の残アウトを投手記録へ
  const st=M.starter;if(st){st.ss.ip+=M.pit.outs;st.ss.k+=M.pit.k;st.ss.er+=M.pit.er;if(win)st.ss.w++;}
  // ※ ss.ip は投球アウト数で保持し、表示時に回へ換算する簡易表記
  // 経験値とレベル
  let lvUps=[];
  const gainExp=(p,amt)=>{p.exp+=amt;while(p.exp>=p.lv*30){p.exp-=p.lv*30;p.lv++;const keys=p.kind==='P'?['vel','ctl','brk','sta']:['meet','pow','run','def'];const k=pick(keys);p[k]=clamp(p[k]+ri(2,4),20,99);lvUps.push(p.name+'がLv'+p.lv+'に！（'+STAT_JP[k]+'アップ）');}};
  M.lineup.forEach(p=>{const r=M.pa[p.id];gainExp(p,10+(r?r.h*8+r.hr*14:0));});
  gainExp(st,8+M.pit.k*3+M.pit.outs);
  // 報酬（MVPボーナス+50も「獲得コイン」に合算し、表示と実額を一致させる）
  const mvp=M.lineup.reduce((a,p)=>{const r=M.pa[p.id];const v=r?r.h*2+r.hr*5+r.rbi:0;return v>(a.v||-1)?{p,v}:a;},{});
  const coinGain=Math.round((win?220:draw?110:60)+M.teamHits*12+M.teamHr*60+M.teamK*8+innPlayed*8+M.score.me*15)+(mvp.p?50:0);
  const tpGain=win?6:3;
  S.coins+=coinGain;S.tp+=tpGain;
  const fanDelta=(win?ri(60,140):draw?10:-ri(10,40))+M.teamHr*15; // 観客動員の増減（結果モーダル表示用に差分を保持）
  S.fans=Math.max(300,S.fans+fanDelta);
  S.career.games++;if(win)S.career.wins++;else if(draw)S.career.draws++;else S.career.losses++;
  missionAdd('play',1);if(win)missionAdd('win',1);missionAdd('hit',M.teamHits);missionAdd('hr',M.teamHr);missionAdd('k',M.teamK);if(M.score.me>=3)missionAdd('run',1);
  if(win){sfx('fanfare');vib('0,60,40,60,40,120');}else sfx('out');
  try{if(window.NativeApp)NativeApp.keepAwake(false);}catch(e){}
  popupN('+'+coinGain+' コイン','#ffd94d');
  // 調子（フォーム）の変動
  M.lineup.concat(st?[st]:[]).forEach(pl=>{pl.form=clamp((pl.form||0)+ri(-1,1),-2,2);});
  // 故障者の回復と新たな故障
  S.players.forEach(pl=>{if(pl.inj>0)pl.inj--;});
  if(Math.random()<0.05){const cand=M.lineup.filter(pl=>!(pl.inj>0));if(cand.length){const ip=pick(cand);ip.inj=ri(1,3);S.news.unshift('🩹 '+ip.name+' が故障で '+ip.inj+'試合離脱…');toast('🩹 '+ip.name+' が故障…');}}
  // マイルストーン（通算記録の節目）
  [['本塁打',S.career.hr-M.teamHr,S.career.hr],['安打',S.career.hits-M.teamHits,S.career.hits],['奪三振',S.career.ks-M.teamK,S.career.ks]].forEach(([nm,prev,now])=>{
    [50,100,200,300,500,1000].forEach(th=>{if(prev<th&&now>=th){S.coins+=200;toast('🎊 チーム通算'+th+nm+'到達！ +200コイン');S.news.unshift('🎊 通算'+th+nm+'到達！');}});});
  // ライバル撃破ボーナス
  let rivalNote='';
  if(S.rival&&M.opp.pitcher&&M.opp.pitcher.name===S.rival&&win){S.coins+=100;rivalNote='<br>🔥 宿敵 '+S.rival+' を撃破！ ボーナス+100';}
  // 本塁打王レース（シーズン中）
  if(S.hrRace&&M.phase==='season'){S.hrRace.forEach(r=>{if(Math.random()<0.55)r.hr+=ri(0,2);});}
  // シーズン戦なら順位表へ
  let seasonNote='';
  if(M.phase==='season'){
    const me=S.standings[0];
    if(win){me.w++;S.standings[1+((S.gameNo-1)%CPU_TEAMS.length)].l++;}else if(draw){me.d++;S.standings[1+((S.gameNo-1)%CPU_TEAMS.length)].d++;}else{me.l++;S.standings[1+((S.gameNo-1)%CPU_TEAMS.length)].w++;}
    simOtherGames();
    S.gameNo++;
    seasonNote='<br>シーズン成績：'+me.w+'勝'+me.l+'敗'+me.d+'分（現在'+myRank()+'位）';
  }
  save();checkAch();
  const perf=M.lineup.map(p=>({p,g:M.gameStats[p.id]})).filter(x=>x.g&&(x.g.h>0||x.g.rbi>0)).sort((a,b)=>(b.g.h*2+b.g.hr*5+b.g.rbi)-(a.g.h*2+a.g.hr*5+a.g.rbi)).slice(0,3);
  const perfHtml=perf.length?'<br>📊 今日の打撃：'+perf.map(x=>x.p.name+' '+x.g.h+'安打'+(x.g.hr?'・'+x.g.hr+'本塁打':'')+'・'+x.g.rbi+'打点').join(' ／ '):'';
  const perfPitch='<br>⚾ 投手陣：奪三振'+M.teamK+' / 失点'+(M.teamEr||0)+((M.relieved||0)?'（継投'+M.relieved+'回）':'');
  let nextNote='';
  if(M.phase==='season'&&S.gameNo>24)nextNote=seasonEndProcess();
  else if(M.phase==='cs'){if(win){S.phase='js';nextNote='<br>🏆 クライマックス突破！ 次は日本シリーズ！';}else nextNote=offseasonStart();}
  else if(M.phase==='js'){if(win){S.career.japan++;S.champYear.push(S.year);nextNote='<br>👑👑 日本一！！ 球団史に刻まれた！';}else nextNote='<br>日本シリーズ敗退…あと一歩だった。';nextNote+=offseasonStart();}
  save();
  const lsCols=Math.max(M.maxInn,M.lines.me.length,M.lines.cpu.length); // 回別ラインスコア（結果モーダル用）
  const lsHtml='<span class="small">'+M.opp.short+'：'+Array.from({length:lsCols},(_,i)=>M.lines.cpu[i]==null?'·':M.lines.cpu[i]).join(' ')+' ＝ '+M.score.cpu+'<br>あなた：'+Array.from({length:lsCols},(_,i)=>M.lines.me[i]==null?'·':M.lines.me[i]).join(' ')+' ＝ '+M.score.me+'</span><br>';
  modal(win?'🎉 勝利！':draw?'△ 引き分け':'● 敗戦…',
   '<div class="center"><b style="font-size:22px">'+M.opp.short+' '+M.score.cpu+' - '+M.score.me+' あなた</b><br>'+lsHtml+
   'ヒット'+M.teamHits+'本 / 本塁打'+M.teamHr+'本 / 奪三振'+M.teamK+'<br>'+
   (mvp.p?'🏅 MVP：'+mvp.p.name+'（+50コイン）<br>':'')+perfHtml+perfPitch+'<br><button class="btn mini" onclick="shareResult()">📤 結果を共有</button> <button class="btn gold mini" onclick="closeModal();setTimeout(()=>{if(S.phase===\'draft\')openDraft();else startMatch();},60)">⚾ 次の試合へ</button><br>'+
   '獲得：🪙 '+coinGain+'コイン / 💪 '+tpGain+'TP<br>👥 観客動員 '+(fanDelta>=0?'+':'')+fanDelta+'人（現在 '+fmt(S.fans)+'人）<br>次の試合：<b>'+nextMatchLabel()+'</b>'+seasonNote+nextNote+rivalNote+
   (lvUps.length?'<br>⬆️ '+lvUps.join('<br>⬆️ '):'')+'</div>',
   ()=>{showHome();});
  S.news.unshift(M.label+'：'+M.score.cpu+'-'+M.score.me+'で'+(win?'勝利':draw?'引分':'敗戦')+'。'+(M.teamHr?' 本塁打'+M.teamHr+'本の花火！':''));
  refreshHUD();
}
function simOtherGames(){
  // 自分以外の4チームで2試合をランダム実施
  const idxs=[1,2,3,4,5].sort(()=>Math.random()-0.5);
  for(let g=0;g<2;g++){
    const a=S.standings[idxs[g*2]],b=S.standings[idxs[g*2+1]];if(!a||!b)continue;
    const r=Math.random();if(r<0.46){a.w++;b.l++;}else if(r<0.92){b.w++;a.l++;}else{a.d++;b.d++;}
  }
}
function seasonEndProcess(){
  const rank=myRank();let note='<br><b>🏁 シーズン終了：'+rank+'位</b>';
  if(rank===1){S.career.titles++;note+='<br>🏆 リーグ優勝！！';}
  if(rank<=3){S.phase='cs';note+='<br>クライマックス進出！ 一発勝負で日本シリーズを狙え。';save();return note;}
  note+=offseasonStart();return note;
}
function offseasonStart(){
  // 年越し処理：加齢・成長・衰え・引退・殿堂
  let notes=[];
  S.players.forEach(p=>{
    p.age++;
    if(p.age<=26){const keys=p.kind==='P'?['vel','ctl','brk','sta']:['meet','pow','run','def'];const k=pick(keys);p[k]=clamp(p[k]+ri(0,p.potential==='S'?4:3),20,99);}
    else if(p.age>=33){const keys=p.kind==='P'?['vel','ctl','brk','sta']:['meet','pow','run','def'];const k=pick(keys);p[k]=clamp(p[k]-ri(1,4),20,99);}
    p.ss={ab:0,h:0,hr:0,rbi:0,sb:0,ip:0,k:0,er:0,w:0};
  });
  const retiring=S.players.filter(p=>p.age>=36&&Math.random()<(p.age-35)*0.22);
  retiring.forEach(p=>{
    S.players=S.players.filter(x=>x!==p);
    if(overall(p)>=72||p.lv>=7){S.hof.push({name:p.name,year:S.year,note:'総合'+overall(p)+' / Lv'+p.lv+'で引退'});notes.push('👑 '+p.name+'が引退し殿堂入り！');}
    else notes.push(p.name+'が引退。お疲れさま。');
  });
  while(S.players.filter(p=>p.kind==='B').length<10){const r=genPlayer('B',Math.random()<0.3?'R':'N',0);S.players.push(r);notes.push('育成選手 '+r.name+' が入団。');}
  while(S.players.filter(p=>p.kind==='P').length<4){const r=genPlayer('P','N',0);S.players.push(r);notes.push('育成投手 '+r.name+' が入団。');}
  S.rival=pick(['山本由伸','今井達也','戸郷翔征','村上頌樹','宮城大弥','高橋宏斗','伊藤大海']);
  S.hrRace=null; // 本塁打王レースはシーズンごとに作り直す（前年の本数が翌年の開幕に残らないように）
  const young=S.players.filter(pl=>pl.age<=23&&pl.potential!=='C');
  if(young.length&&Math.random()<0.6){const yp=pick(young);const kk=yp.kind==='P'?pick(['vel','brk']):pick(['meet','pow']);yp[kk]=clamp(yp[kk]+5,20,99);notes.push('🌟 若手覚醒！ '+yp.name+' の'+STAT_JP[kk]+'が+5');}
  S.career.seasons++;S.year++;S.phase='draft';
  save();
  return '<br>📅 オフシーズン：'+(notes.join(' / ')||'大きな動きなし')+'<br>次はドラフト会議！';
}
let draftList=[];
function openDraft(){
  draftList=[genPlayer('B',Math.random()<0.5?'SR':'R',S.year*0.3),genPlayer('P',Math.random()<0.5?'SR':'R',S.year*0.3),genPlayer(Math.random()<0.5?'B':'P','R',S.year*0.3)];
  openPanel('🌱 '+S.year+'年目 ドラフト会議（1人選べる）',
   '<p>今年の目玉候補たち。選ばなかった選手は他球団へ…</p>'+draftList.map((p,i)=>playerCard(p,' <button class="btn gold mini" onclick="chooseDraft('+i+')">この選手を指名</button>')).join(''));
  $('screen-home').classList.remove('hidden');
}
function chooseDraft(i){
  const p=draftList[i];
  // 登録枠（打者32人・投手16人）をスカウトと同じく尊重する：満杯なら加入せずTP+5に変換
  if(S.players.filter(x=>x.kind===p.kind).length>=(p.kind==='P'?16:32)){
    S.tp+=5;S.news.unshift('ドラフト指名の '+p.name+' は登録枠がいっぱいで入団できず、代わりにTP+5。'+S.year+'年目シーズン開幕。');
    S.standings=freshStandings();S.gameNo=1;S.phase='season';save();closePanel();showHome();refreshHUD();
    toast('枠がいっぱいで '+p.name+' は入団できず…代わりにTP+5');return;
  }
  S.players.push(p);
  S.news.unshift('ドラフトで '+p.name+'（'+p.rarity+'）を指名！ '+S.year+'年目シーズン開幕。');
  S.standings=freshStandings();S.gameNo=1;S.phase='season';sfx('gacha');save();closePanel();showHome();
  toast(p.name+' が入団！ '+S.year+'年目シーズン開幕！');
}
/* --- 初期化・イベント --- */
function bind(){
  $('btn-modal-ok').onclick=closeModal;
  $('btn-help').onclick=renderHelp;
  $('btn-save').onclick=()=>{save();toast('セーブした！（自動セーブもしてるよ）');};
  $('btn-mute').onclick=()=>{if(!S.settings)S.settings={se:1,crowd:1,mute:false};S.settings.mute=!S.settings.mute;$('btn-mute').textContent=S.settings.mute?'🔇':'🔊';save();toast(S.settings.mute?'ミュートにした':'サウンドON');};
  $('btn-pinch').onclick=pinchHit;
  const bSteal=$('btn-steal');if(bSteal)bSteal.onclick=onSteal;
  const bRelief=$('btn-relief');if(bRelief)bRelief.onclick=reliefPitch;
  $('screen-panel').addEventListener('click',e=>{if(e.target===$('screen-panel'))closePanel();});
  $('btn-speed').onclick=()=>{speedMul=speedMul>=3?1:speedMul+1;$('btn-speed').textContent='速度 '+speedMul+'x';toast('試合スピード '+speedMul+'倍');}; // 1x→2x→3x の3段階
  const bCam=$('btn-cam');if(bCam)bCam.onclick=()=>{const modes=[['bat','打撃'],['pitch','投球'],['outfield','外野'],['follow','追従']];const nx=modes[(modes.findIndex(m=>m[0]===camMode)+1)%modes.length];camManualMode=nx[0];camManualUntil=performance.now()+20000;camMode=nx[0];bCam.textContent='📷 '+nx[1];toast('📷 カメラを'+nx[1]+'視点に切替（しばらくキープ）');};
  // ページを離れる/隠れる時に自動セーブ（試合の合間のデータ消失防止）
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  window.addEventListener('beforeunload',()=>{save();});
  $('btn-panel-close').onclick=closePanel;
  $('btn-play').onclick=()=>{ensureMissions();if(S.phase==='draft')openDraft();else startMatch();};
  $('btn-season').onclick=renderSeason;
  $('btn-roster').onclick=renderRoster;
  $('btn-scout').onclick=()=>renderScout();
  $('btn-stadium').onclick=renderStadium;
  $('btn-records').onclick=renderRecords;
  $('btn-missions').onclick=renderMissions;
  $('btn-idle').onclick=()=>{const a=idleAmount();if(a<=0){toast('まだ貯まってない。放置や試合で観客を増やそう');return;}S.coins+=a;S.lastIdle=Date.now();sfx('coin');popupN('+'+fmt(a)+' コイン','#ffd94d');save();refreshHUD();toast('観客収入 '+fmt(a)+'コイン 受け取った！');};
  $('btn-swing').onclick=onSwing;$('btn-take').onclick=onTake;$('btn-bunt').onclick=onBunt;
  $('btn-throw').onclick=onThrow;
  $('btn-sim-half').onclick=simHalf;$('btn-sim-game').onclick=simGame;
  $('btn-quit-game').onclick=()=>{if(!M||M.finished)return;if(confirm('棄権すると敗戦扱いになる。本当にやめる？')){M.score.cpu+=3;finishMatch();}};
  $('photo-input').addEventListener('change',onPhotoFile);
  // ミートカーソルのドラッグ操作（プロスピA式）
  const czone=$('cursor-zone');
  const setCursor=e=>{const r=czone.getBoundingClientRect();cursorPos={x:clamp((e.clientX-r.left)/r.width,0.02,0.98),y:clamp((e.clientY-r.top)/r.height,0.02,0.98)};cursorMoved=true;
    $('cursor-ring').style.left=(cursorPos.x*100)+'%';$('cursor-ring').style.top=(cursorPos.y*100)+'%';};
  czone.addEventListener('pointerdown',e=>{e.preventDefault();setCursor(e);
    const mv=ev2=>setCursor(ev2);const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);});
  document.addEventListener('click',()=>ac(),{once:true});
}
window.addEventListener('load',()=>{
  load();ensureMissions();bind();preloadExtModels();initGL();S._night=false;buildStadium();showHome();
  try{if(window.NativeApp)NativeApp.scheduleDaily(9,0,'ドリームペナント3D','デイリーミッションが更新されたよ！ 今日の試合が待ってる');}catch(e){}
  if(S.settings&&S.settings.mute)$('btn-mute').textContent='🔇';
  setInterval(()=>{refreshHUD();},5000);
  setInterval(()=>{save();},20000);
});
