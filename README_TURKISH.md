# SliferJump 2.0: Rise of Slifer

Modern web standartları ve saf JavaScript (Vanilla JS / HTML5 Canvas) mimarisi üzerine inşa edilmiş, deterministik fizik motoruna, dinamik görünüm kaydırma (viewport scrolling) sistemine, akıllı prosedürel platform üretim algoritmalarına ve gerçek zamanlı Web Audio API ses sentezleyicisine sahip yüksek performanslı 2D dikey platform oyun motoru.

---

## Mimari Genel Bakış

SliferJump 2.0 projesini, herhangi bir ağır oyun motoru veya framework bağımlılığı olmadan, modüler ve bileşen tabanlı (component-driven) bir yazılım mimarisiyle tasarladım ve geliştirdim. Kod tabanı girdi yönetimi, fizik hesaplamaları, varlık (entity) güncellemeleri, canvas render döngüsü, durum makineleri ve ses motoru arasında kesin bir sorumluluk ayrımı (separation of concerns) uygular.

```
SliferJump/
├── index.html                  # Ana DOM yapısı, asset bildirimleri, responsive kapsayıcı
├── manifest.json               # Progressive Web App (PWA) manifest dosyası
├── capacitor.config.json       # Mobil native derleme yapılandırması (Android / iOS)
├── service-worker.js           # Çevrimdışı önbellekleme ve servis işçisi
├── package.json                # Proje paket metadatası ve yerel çalıştırma komutları
│
├── css/
│   └── style.css               # Glassmorphism UI tasarımı, responsive viewport stilleri
│
├── js/
│   ├── config.js               # Global konfigürasyon, 25 seviye verisi, denge parametreleri
│   ├── game.js                 # Ana oyun döngüsü (game loop), durum makinesi (state machine)
│   ├── slifer.js               # Oyuncu varlığı, hareket kinematiği ve zıplama mekaniği
│   ├── platform.js             # Prosedürel basamaklar (Sabit, Hareketli, Kırılgan, Tuzak)
│   ├── lava.js                 # Akıllı lav motoru, zemin sabitleme ve anti-camping sistemi
│   ├── orichalcos.js           # Yerçekimsel girdap ve karadelik simülasyonu
│   ├── meteor.js               # Balistik düşen meteorlar ve izdüşüm uyarı sistemi
│   ├── monster.js              # Devriye gezen canavarlar ve lazer mermi alt sistemi
│   ├── collectible.js          # Kart eşyaları, süreli güçlendirmeler ve envanter yönetimi
│   ├── particles.js            # Yüksek verimli parçacık motoru (toz, kıvılcım, köz, alev)
│   ├── sound-manager.js        # Web Audio API sentezleyicisi ve p5.sound hibrit ses yöneticisi
│   ├── background.js           # Paralaks arka plan renderlama ve bölüm geçiş motoru
│   ├── quest.js                # Görev ilerleme ve dinamik hedef takip sistemi
│   ├── achievement.js          # Başarım (achievement) kilit açma ve yerel kayıt yapısı
│   ├── challenge.js            # URL tabanlı seed ve meydan okuma eşleştirme sistemi
│   ├── storage.js              # LocalStorage profili, rekorlar ve envanter veritabanı
│   └── ui.js                   # HUD canvas çizimleri, modal arayüzler ve bildirimler
│
├── lib/
│   ├── p5.min.js               # Canvas grafik render motoru kütüphanesi
│   └── p5.sound.min.js         # Ses yükleme ve çözümleme kütüphanesi
│
└── assets/
    ├── img/                    # 25 Seviye arka planı, karakter sprite'ları ve HUD ikonları
    └── sound/                  # Ses dosyaları (müzik, zıplama, patlama, kükreme)
```

---

## Çekirdek Motor Mekanikleri ve Matematiksel Model

### 1. Kinematik ve Zıplama Fiziği
Oyuncu karakteri (`Slifer`), yatay eksende sabit hız ve ekran kenarlarından pürüzsüz geçiş (screen wrap) ile hareket eder. Dikey eksende ise standart Newton yerçekimi integrasyonu uygulanır:

$$\Delta v_y = g \cdot \Delta t$$
$$y_{t+1} = y_t + v_y \cdot \Delta t$$

- **Standart Zıplama İmpulsu:** $v_{\text{jump}} = \sqrt{2 \cdot g \cdot h_{\text{jump}}} \approx -5.70\text{ px/frame}$
- **Süper Yay (Milenyum Gözü) İmpulsu:** $v_{\text{super}} = -1.65 \cdot v_{\text{jump}} \approx -9.40\text{ px/frame}$
- **Ekran Sarmalama (Screen Wrap):** $x < 0$ olduğunda $x \leftarrow \text{width}$; $x > \text{width}$ olduğunda $x \leftarrow 0$.

### 2. Görünüm Kaydırma (Viewport Scrolling) ve Yükseklik Skoru
Sonsuz yukarı tırmanışta kayan nokta (floating point) hassasiyet kayıplarını engellemek için, oyuncu ekranın dikey eşik değerini ($y \le \text{height} \cdot 0.35$) aştığı anda tüm dünya aşağıya doğru ötelenir:

$$\text{scrollAmount} = -v_y$$

Sahnedeki tüm aktif varlıklar (platformlar, tehlikeler, mermiler, parçacıklar) $\text{scrollAmount}$ kadar aşağı kaydırılır. Skor, ilk zıplayıştan itibaren kat edilen mutlak dikey mesafe üzerinden anlık hesaplanır:

$$\text{Skor} = \max(0, \text{totalScroll} + (y_{\text{start}} - y)) \cdot \text{Çarpan}$$

### 3. Prosedürel Platform Üretimi
Kameranın yukarısında oyuncunun görüş alanına girmeden önce basamaklar dinamik olarak oluşturulur. Her basamak, bölümün zorluk katsayısına göre ağırlıklı olasılık havuzundan çekilir:
- **Sabit Basamaklar:** Standart, dengeli zıplama yüzeyleri.
- **Hareketli Basamaklar:** Yatay eksende harmonik salınım ($x(t) = x_0 + A \sin(\omega t)$) yapan basamaklar.
- **Kırılgan Basamaklar:** Temas edildiğinde kırılma zamanlayıcısı başlayan ve hemen dağılan basamaklar.
- **Tuzak Basamaklar:** Basıldığında aniden çöken veya yön saptıran sahte zeminler.
- **Milenyum Yayı (Yaylı Modül):** Altın sarısı neon ışıma yayan ve temasta 1.65x süper sıçrama sağlayan mekanizma.

---

## Oyun Alt Sistemleri ve Dinamikler

### Akıllı Dinamik Lav Motoru (Intelligent Lava Engine)
Lav alt sistemi (`js/lava.js`), oyun temposunu dinamik olarak yöneten özel bir algoritmaya sahiptir:
- **Zemin Sabitleme (Floor Clamping):** Lav sürekli yukarı yükselir; ancak maksimum yüksekliğini her zaman oyuncunun bastığı platformun bir alt basamağında sabitler. Bu sayede oyuncuya panik yapmadan bir sonraki zıplamasını planlama alanı tanınır.
- **Anti-Camping Heuristiği:** Oyuncu aynı platform üzerinde 3 defadan fazla yerinde sayarsa (camping yaparsa), zemin sabitlemesi derhal iptal edilir; lav hızla ivmelenerek platformu yutar ve oyuncuyu tırmanmaya zorlar.
- **Katmanlı Batma Simülasyonu:** Lav, Slifer'ın ön katmanında çizilir. Slifer lava düştüğünde lav sıvısının altına gömülür ve kıvılcımlarla eriyerek yok olur.

### Tehlike Simülasyonları
1. **Orichalcos Mührü:** Dönen yerçekimsel karadelik tekilliği. Milenyum Gözü olmadan içine girildiğinde oyuncuyu üstel spiral çekim alanı ($r(t) = r_0 \cdot e^{-kt}$) ile yutar.
2. **Balistik Meteorlar:** Kameranın yukarısında izdüşüm uyarı çemberleri oluşturup alev izleri bırakarak düşen ölümcül kaya mermileri.
3. **Devriye Canavarlar ve Lazerler:** Platformlarda yatay devriye gezen ve belirli aralıklarla doğrusal enerji ışını ateşleyen yaratıklar.

### Envanter ve Güçlendirme Sistemi
- **Milenyum Gözü (Toplanabilir):** Altın daire içindedir. Orichalcos karadeliğine girildiğinde 1 adet harcanarak karadeliği kırar ve oyuncuyu yukarı fırlatarak kurtarır.
- **Işık Kılıçları (Swords of Revealing Light):** 10 saniyelik kalkan oluşturur. Gelen bir meteoru, canavarı veya lazeri emerek kırılma sesiyle yok olur ve oyuncuyu 1 ölümden korur.
- **Yeniden Doğuş (Monster Reborn):** Envanterde en fazla 3 adet birikir. Aşağı düşüldüğünde veya lavlara temas edildiğinde Slifer'ı kurtararak yukarı fırlatır. *(Sadece Orichalcos karadeliğinde işe yaramaz).*
- **Açgözlülük Küpü (Pot of Greed):** 10 saniye boyunca kazanılan tüm tırmanma puanlarını $2\times$ çarpanı ile ikiye katlar.
- **Thunder Force (Nihai Saldırı):** Tırmanışla dolan enerji barı %100'e ulaştığında otomatik ateşlenir. Slifer ağzından skorboarda doğru devasa bir ejderha ateşi püskürtür (**+2000 Puan**), tüm tehlikeleri temizler ve yenilmez olarak gökyüzüne fırlar. Saldırı sonrası bar **10 saniye boyunca deaktif (cooldown)** kalır.

### Hibrit Ses Motoru
`SoundManager` (`js/sound-manager.js`) iki katmanlı çalışır:
1. **Sample Çalma:** `assets/sound/` dizinindeki gerçek ses örnekleri (kükreme, arka plan müziği vb.) p5.sound ve HTML5 `Audio` yedekleriyle gecikmesiz çalınır.
2. **Gerçek Zamanlı Web Audio API Sentezi:** Kristal kalkan kırılması, meteor patlaması, lav kabarcıkları ve karadelik sesleri doğrudan osilatörler, gain düğümleri ve gürültü üreteçleriyle anlık sentezlenir.

---

## Kurulum ve Sıfırdan Çalıştırma Rehberi

Modern web tarayıcıları, ses ve görsel gibi yerel dosyaları `file://` protokolü üzerinden yüklerken güvenlik gerekçesiyle **CORS (Cross-Origin Resource Sharing)** kısıtlaması uygular. Bu nedenle proje yerel bir HTTP sunucusu üzerinden çalıştırılmalıdır.

### Gereksinimler
- [Node.js](https://nodejs.org/) (Sürüm 16.0 veya üzeri) **VEYA** [Python](https://www.python.org/) (Sürüm 3.x)

---

### Adım Adım Çalıştırma

#### 1. Projeyi Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/SliferJump.git
cd SliferJump
```

#### 2. Yerel Sunucuyu Başlatın

**Yöntem A: Node.js ile (Önerilen)**
```bash
# Herhangi bir global kuruluma gerek olmadan doğrudan npx ile:
npx serve -p 5000 .

# Veya npm komutuyla:
npm start
```

**Yöntem B: Python 3 ile**
```bash
python -m http.server 5000
```

**Yöntem C: Visual Studio Code Live Server Eklentisi**
1. VS Code içerisinde **Live Server** (`ritwickdey.LiveServer`) eklentisini yükleyin.
2. Sol gezginde `index.html` dosyasına sağ tıklayın.
3. **Open with Live Server** seçeneğini seçin.

#### 3. Oyuna Erişin
Web tarayıcınızda aşağıdaki adresi açın:
```
http://localhost:5000
```

---

## Kontroller

| Eylem | Masaüstü (Klavye) | Mobil (Dokunmatik) |
| :--- | :--- | :--- |
| **Sola Hareket** | `Sol Ok` / `A` | Ekranın sol yarısına basılı tutun |
| **Sağa Hareket** | `Sağ Ok` / `D` | Ekranın sağ yarısına basılı tutun |
| **Thunder Force** | %100'de Otomatik / `F` | %100'de Otomatik / Enerji Barına Dokunun |
| **Duraklat** | `Escape` | Arayüz Duraklat Butonu |

---

## Mobil Derleme (Capacitor / Android & iOS)

Proje dizininde yer alan `capacitor.config.json` dosyası ile doğrudan mobil APK veya iOS projesi oluşturulabilir:

```bash
# Capacitor CLI yükleyin
npm install @capacitor/core @capacitor/cli

# Web varlıklarını bağlayıp Android projesini derleyin
npx cap init SliferJump com.slifersoft.sliferjump
npx cap add android
npx cap copy
npx cap open android
```

---

## Lisans ve Yasal Bildirim

- **Oyun Motoru ve Kod Mimarisi:** **SliferSoft** tarafından geliştirilmiş olup [MIT Lisansı](LICENSE) kapsamındadır.
- **Sanatsal Bildirim:** Konsept, tematik isimler ve görsel referanslar Duel Monsters evreninden ilham alınarak hazırlanmıştır ve ilgili telif hakkı sahiplerine aittir. Proje tamamen portfolyo ve eğitim amaçlı sunulmaktadır.
