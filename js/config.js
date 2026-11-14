// Data statis: tahap, jenis, lembar persiapan, 15 beat.
export const SCHEMA=1;
export const STAGES=["Persiapan","Menulis","Editorial","Terkirim"];
export const CHECKS={Menulis:["Tulis draf pertama","Capai target jumlah kata","Diamkan 1–2 hari sebelum menyunting"],Editorial:["Revisi alur dan struktur","Sunting bahasa dan ejaan","Baca keras-keras","Cocokkan dengan format ketentuan","Kirim"]};
export const TYPES=["Puisi","Fiksi mini","Cerpen","Novel","Esai","Lainnya"];
export const CSTAT=["Mengincar","Disiapkan","Terkirim","Menang","Tidak lolos"];
export const KEY="meja-tulis-v1";
export const BEATS=[
["Opening Image","Gambaran pembuka","Potret awal dunia dan tokoh sebelum berubah. Tetapkan nada dan titik awal perjalanan.",0,1],
["Theme Stated","Tema dinyatakan","Seseorang mengisyaratkan pelajaran yang kelak harus dipahami tokoh utama, yang belum ia sadari.",5,5],
["Set-Up","Pengenalan","Kenalkan tokoh, kehidupan sehari-harinya, kekurangan, keinginan, dan hal yang perlu berubah.",1,10],
["Catalyst","Pemicu","Peristiwa yang mengguncang dunia tokoh dan tidak bisa diabaikan.",10,10],
["Debate","Perdebatan","Tokoh ragu dan bergulat dengan pilihan. Pertanyaan besar cerita mulai terbentuk.",10,20],
["Break into Two","Memasuki babak dua","Tokoh membuat keputusan sadar untuk melangkah ke situasi atau dunia yang baru.",20,20],
["B Story","Kisah B","Subplot, sering berupa hubungan baru, yang membawa pelajaran tema.",22,22],
["Fun and Games","Bersenang-senang dan bermain","Janji premis dipenuhi: tokoh menjelajahi dunia baru lewat adegan yang membuat pembaca tertarik pada ceritamu.",20,50],
["Midpoint","Titik tengah","Kemenangan atau kekalahan semu. Taruhan naik dan arah cerita bergeser.",50,50],
["Bad Guys Close In","Lawan mendekat","Tekanan luar dan keretakan dalam diri tokoh menggerogoti rencananya.",50,75],
["All Is Lost","Semua hilang","Titik terendah. Ada yang hilang atau “mati”, entah harapan, orang, atau cara hidup lama.",75,75],
["Dark Night of the Soul","Malam gelap jiwa","Tokoh meratap dan merenung hingga berani menghadapi kebenaran tentang dirinya.",75,80],
["Break into Three","Memasuki babak tiga","Pencerahan: pelajaran dari kisah A dan kisah B menyatu menjadi rencana baru.",80,80],
["Finale","Klimaks","Tokoh menerapkan pelajarannya, menghadapi lawan, dan menuntaskan konflik.",80,99],
["Final Image","Gambaran penutup","Cermin dari gambaran pembuka: tunjukkan sejauh mana tokoh telah berubah.",99,100]
];
export const PREP={
Puisi:{title:"Lembar persiapan puisi",intro:"Puisi tidak butuh kerangka kaku. Lembar ini membantu menemukan inti rasa, citraan, dan bentuk sebelum kamu mulai menulis.",items:[
["Pemicu","","Gambar, peristiwa, kalimat yang terdengar, atau perasaan yang membuatmu ingin menulis ini."],
["Inti rasa","","Satu kalimat tentang apa yang ingin dirasakan atau disadari pembaca di akhir."],
["Citraan","","Tiga sampai lima gambaran konkret yang bisa dilihat, didengar, dicium, dirasa, atau diraba."],
["Suara","","Siapa yang berbicara dan kepada siapa? Aku lirik, kau, atau pihak lain."],
["Bentuk","","Pilih bentuk yang melayani isi: bebas, soneta, haiku, pantun, atau balada. Tentukan panjang bait dan baris."],
["Bunyi dan diksi","","Kata kunci, rima, aliterasi, dan irama. Catat juga klise yang ingin dihindari."],
["Perubahan","","Titik tempat nada atau pandangan bergeser, supaya puisi bergerak dan tidak berhenti di satu suasana."],
["Baris penutup","","Rancang akhir yang meninggalkan gema, bukan menjelaskan maksud puisi."],
["Judul","","Judul yang membuka atau menambah makna, bukan sekadar mengulang isi."]]},
"Fiksi mini":{title:"Lembar persiapan fiksi mini",intro:"Fiksi mini (sekitar 100–1.000 kata) menangkap satu momen. Tidak ada ruang untuk pengantar panjang, jadi putuskan intinya sebelum menulis.",items:[
["Satu momen","","Peristiwa tunggal yang menjadi jantung cerita. Cerita ini tentang saat apa?"],
["Tokoh dan keinginan","","Satu tokoh dengan satu keinginan yang jelas."],
["Kalimat pembuka","","Mulai langsung di tengah aksi atau situasi yang menggugah rasa ingin tahu."],
["Detail kunci","","Satu atau dua detail konkret yang cukup untuk menyiratkan latar dan perasaan."],
["Pergeseran","","Putaran, pencerahan, atau perubahan makna yang membuat pembaca ingin membaca ulang."],
["Kalimat penutup","","Berhenti sedikit lebih cepat dari yang terasa wajar dan sisakan ruang untuk pembaca."],
["Judul dan batas kata","","Judul yang ikut bekerja sebagai bagian cerita, plus batas kata lomba, misalnya 100, 300, atau 500."]]},
Cerpen:{title:"Lembar persiapan cerpen",intro:"Cerpen (kira-kira 1.500–5.000 kata) berpusat pada satu konflik utama dengan sedikit tokoh. Cek batas kata atau halaman di ketentuan lomba.",items:[
["Premis","","Satu kalimat: siapa, ingin apa, dan apa yang menghalanginya."],
["Tokoh","","Satu sampai tiga tokoh. Bedakan keinginan yang disadari dengan kebutuhan yang sebenarnya."],
["Latar dan sudut pandang","","Waktu, tempat, dan suasana. Siapa yang bercerita dan mengapa dari sudut itu?"],
["Pembuka","","Adegan atau kalimat pertama yang cepat membawa pembaca ke konflik.",0,10],
["Konflik dan eskalasi","","Dua sampai tiga titik saat tekanan naik dan pilihan tokoh makin sempit.",10,70],
["Klimaks","","Saat tokoh harus memilih dan konflik utama mencapai puncaknya.",70,90],
["Penutup","","Perubahan atau pertanyaan yang tertinggal. Tidak perlu menjelaskan semuanya.",90,100],
["Judul dan motif","","Judul sementara dan satu gambaran atau benda yang berulang sebagai pengikat cerita."]]},
Novel:{title:"Lembar 15 beat",intro:"Kerangka novel dari Save the Cat! Writes a Novel karya Jessica Brody. Tulis satu atau dua kalimat peristiwa untuk tiap beat.",items:BEATS},
Esai:{title:"Lembar persiapan esai",intro:"Esai kuat saat satu gagasan dikembangkan dengan bukti dan sudut pandang yang jelas.",items:[
["Gagasan utama","","Satu kalimat tesis: apa yang ingin kamu yakinkan atau tunjukkan?"],
["Mengapa penting","","Hubungkan dengan pembaca atau peristiwa terkini supaya esai terasa relevan."],
["Bahan dan rujukan","","Data, pengalaman, kutipan, atau sumber yang akan dipakai. Catat asalnya."],
["Susunan argumen","","Urutkan tiga sampai lima poin utama dari pembuka sampai penutup."],
["Bantahan","","Keberatan yang mungkin muncul dan cara kamu menjawabnya."],
["Penutup dan judul","","Kesimpulan atau ajakan yang tajam, serta judul yang menjanjikan sudut pandang."]]},
Lainnya:{title:"Lembar persiapan umum",intro:"Panduan ringkas untuk jenis tulisan lain.",items:[
["Tujuan","","Apa yang ingin dicapai tulisan ini?"],
["Pembaca","","Siapa yang akan membaca dan apa yang sudah mereka ketahui?"],
["Pesan utama","","Satu hal yang harus diingat pembaca."],
["Kerangka","","Bagian utama dan urutannya."],
["Bahan","","Riset, contoh, atau sumber yang diperlukan."]]}
};
