import { Footer, Layout, LocaleSwitch, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "../../global.css";
import { VocabularyHighlighter } from "../../components/VocabularyHighlighter";

export const metadata = {};

// Rewrite tất cả route trong pageMap từ /en sang /{lang}
function rewritePageMap(items, lang) {
  return items.map((item) => {
    const rewritten = { ...item };
    if (rewritten.route) {
      rewritten.route = rewritten.route.replace(/^\/en(\/|$)/, `/${lang}$1`);
    }
    if (rewritten.children) {
      rewritten.children = rewritePageMap(rewritten.children, lang);
    }
    return rewritten;
  });
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;

  const enPageMap = await getPageMap("/en");
  // Với en dùng nguyên, với vi rewrite route để sidebar link đúng locale
  const pageMap = lang === "en" ? enPageMap : rewritePageMap(enPageMap, lang);

  const navbar = (
    <Navbar logo={<b>Reading</b>}>
      <LocaleSwitch lite />
    </Navbar>
  );

  const footer = (
    <Footer
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      Reading 08/02/2026 © MDT Nextra.
    </Footer>
  );

  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning>
      <Head />
      <body suppressHydrationWarning>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/minhducctchv/reading"
          footer={footer}
          i18n={[
            { locale: "en", name: "English" },
            { locale: "vi", name: "Tiếng Việt" },
          ]}
        >
          {children}
        </Layout>
        <VocabularyHighlighter />
      </body>
    </html>
  );
}
