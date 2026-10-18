import { useEffect, useRef } from "react";
import { useLocale } from "../../i18n/localeContext.js";
import { registerStageView } from "../stage/stage.js";
import { CHAPTERS, scrollToChapter } from "../header/chapters.js";
import CloudBank from "../chapters/CloudBank.jsx";

const loadFooterView = (context) =>
  import("../footer3d/createFooterView.js").then(({ createFooterView }) => createFooterView(context));

export default function FooterSection() {
  const { t } = useLocale();
  const sceneHostRef = useRef(null);

  useEffect(() => {
    const registration = registerStageView(sceneHostRef.current, loadFooterView, { priority: "idle" });
    return () => registration.unregister();
  }, []);

  return (
    <footer className="site-footer">
      <div ref={sceneHostRef} className="absolute inset-0" aria-hidden="true" />
      <CloudBank color="#f6a6b9" backColor="#ffd3dc" />
      <div className="site-footer-content">
        <p className="site-footer-title">{t.footer.title}</p>
        <p className="site-footer-place">{t.footer.body}</p>
        <nav aria-label="Footer" className="site-footer-links">
          {CHAPTERS.map((chapterId) => (
            <a
              key={chapterId}
              href={`#${chapterId}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToChapter(chapterId);
              }}
            >
              {t.nav.chapters[chapterId]}
            </a>
          ))}
        </nav>
        <div className="site-footer-bottom">
          <span>{t.footer.rights(new Date().getFullYear())}</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            {t.footer.backToTop} ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
