<p align="center">
  <img src="https://raw.githubusercontent.com/QLineTech/Q-Code/refs/heads/main/assets/icon.png" alt="QCode Logo" width="150"/>
</p>

<h1 align="center">QCode - QLineTech Coding Assistant 🌱</h1>

<p align="center">
  <a href="https://github.com/QLineTech/Q-Code/releases"><img src="https://img.shields.io/github/v/release/QLineTech/Q-Code?color=green&label=Version" alt="Version Badge"/></a>
  
  <a href="https://github.com/QLineTech/Q-Code/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/License-CUSTOM-blue" alt="License Badge"/></a>
  <a href="https://vscode.dev"><img src="https://img.shields.io/badge/VS%20Code-1.97%2B-lightgrey" alt="VS Code Badge"/></a>
</p>

---

## English 🌍

**QCode** is a VS Code extension by QLineTech, enhancing your coding experience with voice commands and AI-powered assistance via xAI's Grok 3 model. It integrates code analysis, file modification, and custom commands into your workflow seamlessly.

### Recent Updates ✨
- Automated version increment in `package.json` with each build.
- Cross-platform build scripts for Windows, Linux, and macOS.

### Features 🚀
- **Voice Commands**: Control via WebSocket server.
- **Code Analysis**: Grok 3-powered suggestions.
- **File Modification**: AI-driven content updates (e.g., comments).
- **Custom Commands**: Quick actions like "Hello World".
- **Configurable API Keys**: Secure xAI integration.

### Prerequisites 📋
| Requirement         | Details                              |
|---------------------|--------------------------------------|
| **VS Code**         | 1.97.0 or higher                    |
| **xAI API Key**     | Sign up at [xAI](https://x.ai)      |
| **WebSocket Server**| `ws://localhost:9001` (see below)   |
| **Node.js**         | For local builds                    |
| **Build Tools**     | Windows: PowerShell<br>Linux/macOS: `jq` |

### Installation ⚙️
#### From VSIX File
1. Download `QLineTech.qcode-<version>.vsix` from [Releases](https://github.com/QLineTech/Q-Code/releases).
2. Install:
   ```bash
   code --install-extension QLineTech.qcode-<version>.vsix
   ```
3. Reload VS Code.

#### From Source
1. Clone the repo:
   ```bash
   git clone https://github.com/QLineTech/Q-Code.git
   cd qcode
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Follow [How to Build](#how-to-build).

### How to Build 🛠️
Builds increment the version, package with `vsce`, and install in VS Code.

| Platform | Command            | Requirements                       |
|----------|--------------------|------------------------------------|
| Windows  | `./util/build.ps1` | `vsce`, VS Code in default path   |
| Linux    | `./util/build.sh`  | `vsce`, `jq`, `/usr/bin/code`     |
| macOS    | `./util/build.sh`  | `vsce`, `jq`, VS Code app path    |

Output: `qcode-<version>.vsix`.

### Usage 📖
#### Commands
- `QCode: Hello World` - Shows "Hello World".
- `QCode: Analyze with Grok3` - Analyzes code.
- `QCode: Modify File with Grok3` - Edits files.

#### Voice Commands
1. Start the voice server (see below).
2. Keybindings:
   - `Ctrl+Shift+R`: Start recording.
   - `Ctrl+Shift+S`: Stop recording.
3. Commands: "hello", "analyze", "modify".

#### Configuration
In VS Code settings (`Ctrl+,`):
- `qcode.apiKey`: xAI API key (required).
- `qcode.apiKey2`: Secondary key (optional).

### Voice Server Setup 🎙️
- **URL**: `ws://localhost:9001`
- **Example**: [example-voice-server](https://github.com/QLineTech/Q-Code-example-voice-server)

<p align="center">
  <img src="https://via.placeholder.com/300x200.png?text=Voice+Server+Setup" alt="Voice Server Setup" width="300"/>
  <br><em>Caption: Setting up the WebSocket server for voice commands</em>
</p>

### Development 🌟
#### Testing
Press `F5` to launch a dev instance.

#### Dependencies
- `axios`: API calls.
- `ws`: WebSocket.

### Troubleshooting 🐞
- **API Key Error**: Set `qcode.apiKey`.
- **WebSocket Issue**: Check `ws://localhost:9001`.
- **Build Failure**: Ensure `vsce`/`jq` installed.

### Contributing 🤝
Fork, branch, and submit a PR.

### License 📜
Free for non-commercial use; commercial use needs a QLineTech license. See [LICENSE.md](LICENSE.md).

### Contact 📧
- Support: [support@q-e.io](mailto:support@q-e.io)
- Sales: [sales@q-e.io](mailto:sales@q-e.io)

---

## Türkçe (Turkish) 🇹🇷

**QCode**, QLineTech tarafından geliştirilen bir VS Code eklentisidir. Sesli komutlar ve xAI’nin Grok 3 modeli ile yapay zeka destekli yardım sunar.

### Son Güncellemeler ✨
- Her yapımda `package.json` sürümü otomatik artar.
- Windows, Linux ve macOS için yapım betikleri.

### Özellikler 🚀
- **Sesli Komutlar**: WebSocket ile kontrol.
- **Kod Analizi**: Grok 3 ile öneriler.
- **Dosya Düzenleme**: Yapay zeka ile güncelleme.
- **Özel Komutlar**: Hızlı eylemler.
- **API Anahtarları**: Güvenli entegrasyon.

### Gereksinimler 📋
| Gereksinim          | Ayrıntılar                          |
|---------------------|-------------------------------------|
| **VS Code**         | 1.97.0 veya üstü                   |
| **xAI API Anahtarı**| [xAI](https://x.ai) adresinden     |
| **WebSocket Sunucu**| `ws://localhost:9001` (aşağıya bkz)|
| **Node.js**         | Yerel yapım için                   |
| **Yapım Araçları**  | Windows: PowerShell<br>Linux/macOS: `jq` |

### Kurulum ⚙️
#### VSIX Dosyasından
1. `QLineTech.qcode-<version>.vsix` dosyasını [Releases](https://github.com/QLineTech/Q-Code/releases) sayfasından indirin.
2. Kurun:
   ```bash
   code --install-extension QLineTech.qcode-<version>.vsix
   ```
3. VS Code’u yeniden başlatın.

#### Kaynaktan
1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/QLineTech/Q-Code.git
   cd qcode
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. [Nasıl Yapılır](#nasıl-yapılır-how-to-build) bölümüne bakın.

### Nasıl Yapılır (How to Build) 🛠️
Yapımlar sürümü artırır, `vsce` ile paketler ve kurar.

| Platform | Komut             | Gereksinimler                     |
|----------|-------------------|-----------------------------------|
| Windows  | `./util/build.ps1`| `vsce`, varsayılan VS Code yolu  |
| Linux    | `./util/build.sh` | `vsce`, `jq`, `/usr/bin/code`    |
| macOS    | `./util/build.sh` | `vsce`, `jq`, VS Code app yolu   |

Çıktı: `qcode-<version>.vsix`.

### Kullanım 📖
#### Komutlar
- `QCode: Merhaba Dünya` - Mesaj gösterir.
- `QCode: Grok3 ile Analiz` - Kod analizi.
- `QCode: Grok3 ile Dosya Düzenle` - Dosya düzenler.

#### Sesli Komutlar
1. Ses sunucusunu başlatın (aşağıya bkz.).
2. Kısayollar:
   - `Ctrl+Shift+R`: Kaydı başlat.
   - `Ctrl+Shift+S`: Kaydı durdur.
3. Komutlar: "merhaba", "analiz", "düzenle".

#### Yapılandırma
Ayarlar (`Ctrl+,`):
- `qcode.apiKey`: xAI anahtarı (gerekli).
- `qcode.apiKey2`: İkincil anahtar (isteğe bağlı).

### Ses Sunucusu Kurulumu 🎙️
- **URL**: `ws://localhost:9001`
- **Örnek**: [example-voice-server](https://github.com/QLineTech/Q-Code-example-voice-server)

<p align="center">
  <img src="https://via.placeholder.com/300x200.png?text=Ses+Sunucusu+Kurulumu" alt="Ses Sunucusu Kurulumu" width="300"/>
  <br><em>Altyazı: Ses komutları için WebSocket sunucusunu kurma</em>
</p>

### Geliştirme 🌟
#### Test Etme
`F5` ile geliştirme örneği başlatın.

#### Bağımlılıklar
- `axios`: API çağrıları.
- `ws`: WebSocket.

### Sorun Giderme 🐞
- **API Anahtar Hatası**: `qcode.apiKey` ayarlayın.
- **WebSocket Sorunu**: `ws://localhost:9001` kontrol edin.
- **Yapım Hatası**: `vsce`/`jq` kurulu mu?

### Katkıda Bulunma 🤝
Çatallayın, dal oluşturun, PR gönderin.

### Lisans 📜
Ticari olmayan kullanım ücretsiz; ticari için lisans gerekir. [LICENSE.md](LICENSE.md).

### İletişim 📧
- Destek: [support@q-e.io](mailto:support@q-e.io)
- Satış: [sales@q-e.io](mailto:sales@q-e.io)

---
<p align="center">Made with 💡 by QLineTech</p>
```

---

### Enhancements Added
1. **Visuals**:
   - Centered logo placeholder at the top (replace with your actual logo).
   - Image placeholders for voice server setup with captions (replace as needed).

2. **Badges**:
   - Minimal badges for version, license, and VS Code compatibility at the top.

3. **Emojis**:
   - Calm and professional: 🌱, ✨, 🚀, 📋, ⚙️, 🛠️, 📖, 🎙️, 🌟, 🐞, 🤝, 📜, 📧, 💡.
   - Used sparingly to highlight sections.

4. **Formatting**:
   - **Headers**: Clear hierarchy with `#`, `##`, `###`.
   - **Tables**: Prerequisites and build instructions for clean presentation.
   - **Lists**: Bullet points for features, steps, and dependencies.
   - **Code Blocks**: Commands and scripts in `bash` or `powershell`.

5. **Structure**:
   - Centered title and badges for a polished look.
   - Separated English and Turkish sections with flags (🌍, 🇹🇷).
   - Consistent layout for both languages.
