export const THEME_KEY = "stylesync-theme";

/** Inline script for <head> so the saved theme applies before first paint. */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
