
Seu site está ativo em 

https://rosemeremelo.github.io/pdf_rapido/

# Fotos em PDF — Conversor Local

Uma aplicação web (Single Page Application) moderna, leve e focada em privacidade, que permite converter fotos da galeria do celular ou computador em um arquivo PDF consolidado. 

Todo o processamento de imagens e a compilação do documento ocorrem **100% no lado do cliente (client-side)**. Isso significa que seus arquivos nunca são enviados para um servidor, garantindo total privacidade e funcionamento offline.

---

## ✨ Recursos

- **Privacidade Absoluta:** Sem cadastros, sem banco de dados e sem envio de arquivos para servidores externos.
- **Otimização Inteligente:** Fotos de alta resolução de smartphones são comprimidas e redimensionadas automaticamente para evitar travamentos do navegador e arquivos PDF excessivamente pesados.
- **Organização Intuitiva:** 
  - Arraste e solte (*drag-and-drop*) para ordenar as fotos no computador.
  - Setas de ordenação dedicadas para facilidade de uso em telas de celulares.
- **Configuração de Layout:**
  - Escolha entre o tamanho padrão **A4** (com ajuste de proporção) ou o **Tamanho Original** de cada foto.
  - Opções de margens (sem margens para escaneamento perfeito ou margens finas para documentos limpos).
- **Interface Moderna:** Suporte completo a tema claro e escuro, baseado nas preferências do seu sistema.
- **Responsivo e Mobile-First:** Interface fluida projetada especificamente para uso rápido em telas de toque (smartphones e tablets).

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica e acessível.
- **CSS3 & Tailwind CSS:** Estilização utilitária rápida com design moderno.
- **JavaScript (Vanilla JS):** Lógica de aplicação assíncrona, compressão em Canvas e manipulação do DOM sem frameworks pesados.
- **jsPDF:** Biblioteca externa responsável pela montagem física do documento PDF localmente no navegador.

---

## 📁 Estrutura de Arquivos

O projeto está dividido em três arquivos simples que podem ser hospedados em qualquer servidor estático (como GitHub Pages, Vercel ou Netlify):

```text
├── index.html     # Estrutura de marcação e referências a bibliotecas
├── style.css      # Variáveis de tema escuro/claro, transições e efeitos de scanner
└── app.js         # Lógica de controle de estado, compressão de imagens e geração do PDF