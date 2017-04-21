var $ = jQuery.noConflict();
var this_js_script = $('script[src*=accessibilitymenu]'); // or better regexp to get the file name..

var debugMode = true;

//var lang = this_js_script.attr('data-language');
//if (typeof lang === "undefined") {
//    var lang = 'heb';
//}

var lang = getScriptAttribute(this_js_script, "language", "heb");
var accessibilitySign = getScriptAttribute(this_js_script, "sign", "classic");
var sourceMenu = getScriptAttribute(this_js_script, "oemsource", "regular");

if (sourceMenu == "accessible+") {
  if (typeof curLang != "undefined") {
    if (debugMode) console.log(curLang);
    lang = curLang;
  } else {
    switch (lang) {
      case "heb":
        lang = "he_IL";
        break;
      case "eng":
        lang = "en_US";
    }
  }
} else {
  switch (lang) {
    case "heb":
      lang = "he_IL";
      break;
    case "eng":
      lang = "en_US";
  }
}

var accessibilityIconStr = (accessibilitySign === "classic") ? 'http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' : 'http://shakedwebdesign.com/plugins/accessibility-menu/access.png';

if (debugMode) console.log("loaded with language: " + lang);


var accessibilityShown = false;
var textSizeBigger = false;
var areLinksYellow = false;
var isGrayscale = false;
var isHighContrast = false;
var areLinksUnderlined = false;

var cookieName = "accessibility";

var init = true;

var basil = new window.Basil();

prepMenu();
setAccessibityFromCookie();
makeAccessible();

function getScriptAttribute(scriptObject, attributeName, defaultValue) {
  var tmp = scriptObject.attr('data-' + attributeName);
  if (typeof tmp === "undefined") {
    var tmp = defaultValue;
  }
  return tmp;
}

function prepMenu() {

  $("body").prepend("<div id='slideout'></div>");
  var menuHTML = "";

  switch (lang) {
    case "he_IL":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='" + accessibilityIconStr + "' alt='Accessibility Menu Icon' role='navigation' title='תפריט נגישות'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='rtl'>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;גודל גופן גדול</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;גודל גופן רגיל </button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;מצב ניגודיות גבוהה</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;מצב ניגודיות רגילה</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;הדגש קישורים בצהוב</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;הצג קישורים כרגיל</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;מצב גווני אפור</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;מצב צבע רגיל</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;הצג קו תחת קישורים</button>";
      menuHTML += "<button class='accessibilityMenuButton alignRight' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;הצג קישורים כרגיל</button>";
      break;
    case "en_US":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='" + accessibilityIconStr + "' alt='Accessibility Menu Icon' role='navigation' title='Accessibility Menu'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;large font</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;normal font </button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;high contrast mode</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;regular contrast mode</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;yellow colored links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;normal colored links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;grayscale color mode</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;regular color mode</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;underline links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;default links</button>";

      break;
    case "es_ES":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='Icono del menú Accesibilidad' role='navigation' title='Menú accesibilidad'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;letra grande</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;letra normal</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modo de contraste alto</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modo de contraste regulares</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;amarillo eslabones de color</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;eslabones de color normales</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modo de color en escala de grises</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modo de color normal</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;subrayar los enlaces</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;enlaces normales</button>";
      break;
    case "pt_PT":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='ícone do menu de acessibilidade' role='navigation' title='menu de acessibilidade'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;letra grande</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;fonte normal</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modo de alto contraste</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modo de contraste regulares</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;ligações de cor amarela</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;ligações coloridas normais</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modo de cor em tons de cinza</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modo de cor normal</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;sublinhar os links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;ligações normais</button>";
      break;
    case "ja_JP":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='アクセシビリティメニューアイコン' role='navigation' title='アクセシビリティメニュー'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;大きなフォント</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;通常のフォント </button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;ハイコントラストモード</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;定期的なコントラストモード</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn' onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;黄色のリンク</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;通常の着色されたリンク</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;グレースケールカラーモード</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;レギュラーカラーモード</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;リンクに下線</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;デフォルトのリンク</button>";
      break;
    case "it_IT":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='Icona Accessibilità Menu' role='navigation' title='Accessibilità Menu'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;font grande</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;carattere normale </button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modalità ad alto contrasto</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;modalità di contrasto regolare</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;giallo collegamenti colorati</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;normali collegamenti colorati</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modalità a colori in scala di grigi</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;modalità colore normale</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;sottolineare i collegamenti</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;collegamenti predefiniti</button>";
      break;
    case "fr_FR":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='Accessibilité Menu icon' role='navigation' title='Accessibilité Menu'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;grande police</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;police normale</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;mode de contraste élevé</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;mode de contraste régulier</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;liens de couleur jaune</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;liens de couleur normale</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;mode couleur en niveaux de gris</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;mode couleur régulière</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;souligner les liens</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;liens par défaut</button>";
      break;
    case "de_DE":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='Barrierefreiheit Menü Icon' role='navigation' title='Erreichbar Menü'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;große Schrift</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;normale Schrift</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;Modus mit hohem Kontrast</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;regelmäßige Kontrastmodus</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;gelb gefärbte Links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;normale farbige Links</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;Graustufen-Farbmodus</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;regelmäßige Farbmodus</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;Links unterstreichen</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;Standard Links</button>";
      break;
    case "zh_CN":
      menuHTML = "<button class='transparentButton' onclick='toggleAccessibilityMenu()'><img class='accessibilityimage' src='http://shakedwebdesign.com/plugins/accessibility-menu/accessibility.png' alt='辅助功能菜单图标' role='navigation' title='辅助菜单'/></button>";
      menuHTML += "<div id='slideout_inner'>";
      menuHTML += "<ul class='ltr'>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOn' onclick='setTextSize(true);'><i class='fa fa-text-height' aria-hidden='true'></i>&nbsp;&nbsp;大字体</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnTextSizeOff' onclick='setTextSize(false);'><i class='fa fa-font' aria-hidden='true'></i>&nbsp;&nbsp;正常字体</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOn' onclick='ToggleHighContrastMode(true);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;高对比度模式</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnHighContrastOff' onclick='ToggleHighContrastMode(false);'><i class='fa fa-adjust' aria-hidden='true'></i>&nbsp;&nbsp;定期对比度模式</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOn'onclick='ToggleLinksYellow(true);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;黄色链接</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnYellowLinksOff' onclick='ToggleLinksYellow(false);'><i class='fa fa-pencil' aria-hidden='true'></i>&nbsp;&nbsp;正常颜色的链接</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOn' onclick='ToggleGrayscaleMode(true);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;灰度色彩模式</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnGrayscaleOff' onclick='ToggleGrayscaleMode(false);'><i class='fa fa-barcode' aria-hidden='true'></i>&nbsp;&nbsp;常色模式</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOn' onclick='ToggleUnderlineLinks(true);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;链接下划线</button>";
      menuHTML += "<button class='accessibilityMenuButton alignLeft' id='btnLinksOff' onclick='ToggleUnderlineLinks(false);'><i class='fa fa-underline' aria-hidden='true'></i>&nbsp;&nbsp;默认链接</button>";

      break;

  }

  menuHTML += "</ul>";
  if (sourceMenu != "accessible+") {

    menuHTML += "<div style='text-align:center;'>";
    menuHTML += "<a href='http://sharon.shaked.me/?utm_source=Accessibility%20Menu&utm_medium=%20Accessibility%20Menu&utm_term=%20Accessibility%20Menu&utm_content=%20Accessibility%20Menu&utm_campaign=menu%20logo' aria-label='link to accessibility menu creator website - Sharon Shaked Software Services' title='Sharon Shaked Software Services' target='_blank'><img src='http://shakedwebdesign.com/plugins/accessibility-menu/boxs-only.png' class='myLogo'></a>";
    menuHTML += "</div>";
  }
  menuHTML += "</div>";


  $("#slideout").html(menuHTML);


  var cssText = "<link href='/public/accessible/styles/yellow-links.css' title='yellow' type='text/css' rel='stylesheet' disabled='true'/>";
  cssText += "<link href='/public/accessible/styles/underline-links.css' title='underline' type='text/css' rel='stylesheet' disabled='true'/>";
  cssText += "<link href='/public/accessible/styles/grayscale.css' title='grayscale' type='text/css' rel='stylesheet' disabled='true'/>";

  if (sourceMenu == "accessible+") {
    cssText += "<link href='/public/accessible/styles/night.css' title='contrast' type='text/css' rel='stylesheet' disabled='true'/>";
    cssText += "<link href='/public/accessible/styles/biggest.css' title='textsize' type='text/css' rel='stylesheet' disabled='true'/>";
  } else {
    cssText += "<link href='/public/accessible/styles/high-contrast.css' title='contrast' type='text/css' rel='stylesheet' disabled='true'/>";
    cssText += "<link href='/public/accessible/styles/bigger.css' title='textsize' type='text/css' rel='stylesheet' disabled='true'/>";
  }


  $("head").append(cssText);

}

function toggleAccessibilityMenu() {
  if (accessibilityShown) {
    $("#slideout").css("left", "0");
    $("#slideout_inner").css("left", "-250px");
  } else {
    $("#slideout").css("left", "250px");
    $("#slideout_inner").css("left", "0");

  }

  accessibilityShown = !accessibilityShown;
}


function setTextSize(newSize) {
  if (debugMode) console.log("set size: " + newSize);
  if (newSize === "true" || newSize === true) {

    textSizeBigger = true;

    if ($('link[title=textsize]').length == 0) {
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "http://shakedwebdesign.com/plugins/accessibility-menu/bigger.css",
        title: "textsize"
      }).appendTo("head");
      $('link[title=textsize]')[0].disabled = false;
    } else {
      $('link[title=textsize]')[0].disabled = false;
    }


    $("#btnTextSizeOff").attr("disabled", false);
    $("#btnTextSizeOff").attr("aria-disabled", false);
    $("#btnTextSizeOn").attr("disabled", true);
    $("#btnTextSizeOn").attr("aria-disabled", true);

  } else {

    if ($('link[title=textsize]').length > 0) {
      $('link[title=textsize]')[0].disabled = true;
    }


    textSizeBigger = false;

    $("#btnTextSizeOff").attr("disabled", true);
    $("#btnTextSizeOff").attr("aria-disabled", true);
    $("#btnTextSizeOn").attr("disabled", false);
    $("#btnTextSizeOn").attr("aria-disabled", false);
  }

  if (!init) createCookie(cookieName);
}

function ToggleUnderlineLinks(mode) {
  if (!(mode === "true" || mode === true)) {
    if ($('link[title=underline]').length > 0) {
      $('link[title=underline]')[0].disabled = true;
    }

    areLinksUnderlined = false;
    $("#btnLinksOff").attr("disabled", true);
    $("#btnLinksOff").attr("aria-disabled", true);
    $("#btnLinksOn").attr("disabled", false);
    $("#btnLinksOn").attr("aria-disabled", false);

  } else {
    if (debugMode) console.log("0");
    if ($('link[title=underline]').length == 0) {
      if (debugMode) console.log("1");
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "http://shakedwebdesign.com/plugins/accessibility-menu/underline-links.css",
        title: "underline"
      }).appendTo("head");
    } else {
      if (debugMode) console.log("2");
      $('link[title=underline]')[0].disabled = false;
    }
    areLinksUnderlined = true;
    $("#btnLinksOff").attr("disabled", false);
    $("#btnLinksOff").attr("aria-disabled", false);
    $("#btnLinksOn").attr("disabled", true);
    $("#btnLinksOn").attr("aria-disabled", true);


  }

  if (!init) createCookie(cookieName);
}

function ToggleLinksYellow(mode) {
  if (!(mode === "true" || mode === true)) {
    if ($('link[title=yellow]').length > 0) {
      $('link[title=yellow]')[0].disabled = true;
    }

    areLinksYellow = false;
    $("#btnYellowLinksOff").attr("disabled", true);
    $("#btnYellowLinksOff").attr("aria-disabled", true);
    $("#btnYellowLinksOn").attr("disabled", false);
    $("#btnYellowLinksOn").attr("aria-disabled", false);

  } else {
    if ($('link[title=yellow]').length == 0) {
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "http://shakedwebdesign.com/plugins/accessibility-menu/yellow-links.css",
        title: "yellow"
      }).appendTo("head");
    } else {
      $('link[title=yellow]')[0].disabled = false;
    }
    areLinksYellow = true;

    $("#btnYellowLinksOff").attr("disabled", false);
    $("#btnYellowLinksOff").attr("aria-disabled", false);
    $("#btnYellowLinksOn").attr("disabled", true);
    $("#btnYellowLinksOn").attr("aria-disabled", true);
  }

  if (!init) createCookie(cookieName);
}

function ToggleHighContrastMode(mode) {
  if (!(mode === "true" || mode === true)) {
    if ($('link[title=contrast]').length > 0) {
      $('link[title=contrast]')[0].disabled = true;
    }
    isHighContrast = false;
    $("#btnHighContrastOff").attr("disabled", true);
    $("#btnHighContrastOff").attr("aria-disabled", true);
    $("#btnHighContrastOn").attr("disabled", false);
    $("#btnHighContrastOn").attr("aria-disabled", false);
  } else {
    if ($('link[title=contrast]').length == 0) {
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "/public/accessible/styles/high-contrast.css",
        title: "contrast"
      }).appendTo("head");
      $('link[title=contrast]')[0].disabled = false;
    } else {
      $('link[title=contrast]')[0].disabled = false;
    }
    isHighContrast = true;
    $("#btnHighContrastOff").attr("disabled", false);
    $("#btnHighContrastOff").attr("aria-disabled", false);
    $("#btnHighContrastOn").attr("disabled", true);
    $("#btnHighContrastOn").attr("aria-disabled", true);
  }

  if (!init) createCookie(cookieName);
}

function ToggleGrayscaleMode(mode) {
  if (!(mode === "true" || mode === true)) {
    if ($('link[title=grayscale]').length > 0) {
      $('link[title=grayscale]')[0].disabled = true;
    }
    isGrayscale = false;
    $("#btnGrayscaleOff").attr("disabled", true);
    $("#btnGrayscaleOff").attr("aria-disabled", true);
    $("#btnGrayscaleOn").attr("disabled", false);
    $("#btnGrayscaleOn").attr("aria-disabled", false);
  } else {
    if ($('link[title=contrast]').length == 0) {
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "http://shakedwebdesign.com/plugins/accessibility-menu/grayscale.css",
        title: "grayscale"
      }).appendTo("head");
      $('link[title=grayscale]')[0].disabled = false;
    } else {
      $('link[title=grayscale]')[0].disabled = false;
    }
    isGrayscale = true;
    $("#btnGrayscaleOff").attr("disabled", false);
    $("#btnGrayscaleOff").attr("aria-disabled", false);
    $("#btnGrayscaleOn").attr("disabled", true);
    $("#btnGrayscaleOn").attr("aria-disabled", true);
  }

  if (!init) createCookie(cookieName);
}

function createCookie(name, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "" + date.toGMTString();
  } else {
    var date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    var expires = "" + date.toGMTString();
  }
  var cookie = {
    "textSize": textSizeBigger,
    "yellowLinks": areLinksYellow,
    "grayscale": isGrayscale,
    "highContrast": isHighContrast,
    "underlineLinks": areLinksUnderlined,
    "expiration": expires
  };

  basil.set(cookieName, JSON.stringify(cookie));

  if (debugMode) console.log("create cookie: " + basil.get(cookieName));
}


function readCookie(name) {

  if (debugMode) console.log("trying to get cookie: " + name);

  var cookie = JSON.parse(basil.get(cookieName));


  //If null, will use defaults already
  if (cookie != null) {
    if (debugMode) console.log("cookie found");

    areLinksUnderlined = cookie.underlineLinks;
    isHighContrast = cookie.highContrast;
    isGrayscale = cookie.grayscale;
    areLinksYellow = cookie.yellowLinks;
    textSizeBigger = cookie.textSize;

  }
  return null;
}

function setAccessibityFromCookie() {
  readCookie(cookieName);
  setTextSize(textSizeBigger);
  ToggleGrayscaleMode(isGrayscale);
  ToggleHighContrastMode(isHighContrast);
  ToggleLinksYellow(areLinksYellow);
  ToggleUnderlineLinks(areLinksUnderlined);

  init = false;
}

function makeAccessible() {
  // set empty alt attribute to any image that does not contain an alt tag:
  $('img:not([alt])').attr('alt', '');

  // copy link title into aria-label:
  $('a[title]').each(function () {
    $(this).attr('aria-label', $(this).attr('title'));
  });

  if ($("nav").attr('role') == undefined) {
    $("nav").attr('role', "navigation");
  }

}
