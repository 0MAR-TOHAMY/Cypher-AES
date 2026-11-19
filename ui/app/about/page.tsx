import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  BrowserIcon,
  CheckmarkCircle02Icon,
  CpuIcon,
  FileImageIcon,
  FileLockedIcon,
  IdIcon,
  Image01Icon,
  InformationCircleIcon,
  Key01Icon,
  Layers01Icon,
  LibraryIcon,
  TestTube01Icon,
  UserGroupIcon,
  WorkflowSquare03Icon,
} from "@hugeicons/core-free-icons";
import "./about.css";

export const metadata: Metadata = {
  title: "عن المشروع",
  description: "وصف مشروع تشفير الصور باستخدام AES وتوزيع المهام على الفريق",
};

function Ico({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.7}
      aria-hidden="true"
    />
  );
}

// ====== بيانات الفريق ======
const TEAM = [
  {
    name: "عبد الله محمد على محمد عبد النبى",
    id: "404058",
    icon: FileImageIcon,
    role: "قراءة الصورة وتجهيز البكسلات",
    files: ["abdallah/image-io.ts"],
    did: [
      "تحويل الصورة إلى بكسلات RGBA، وإعادة بنائها بصيغة PNG بعد فك التشفير.",
      "استكمال كل صف بأصفار حتى يصبح طوله مضاعفًا لـ16 byte، فيبقى كل block في موضعه ويظهر نمط ECB.",
      "حذف قناة alpha في الصور المعتمة، والإبقاء عليها في الصور التي تحتوي على شفافية.",
      "اختبار استعادة الصورتين وصور حدّية (1×1، شفافة، عرض فردي) بالأوضاع الثلاثة.",
    ],
  },
  {
    name: "عمر حسين محمد تهامى",
    id: "404062",
    icon: Key01Icon,
    role: "توليد المفتاح والقيم وربط المراحل",
    files: ["omar/keys.ts", "omar/manual.ts"],
    did: [
      "توليد مفتاح AES-256 عشوائي (32 byte) باستخدام randomBytes من المكتبة.",
      "اشتقاق المفتاح اختياريًا من عبارة سرية وSalt باستخدام PBKDF2-SHA256.",
      "قراءة IV بصيغة Hex، وتحويل قيمة Counter العشرية إلى 16 byte.",
      "ربط المراحل من استلام الصورة حتى إخراج النتيجة، وتوليد IV أو Counter تلقائيًا، ومنع تجاوز عداد CTR.",
    ],
  },
  {
    name: "عمرو احمد عبد الكريم عبد الحليم الصفطاوى",
    id: "404065",
    icon: CpuIcon,
    role: "محرك AES بالأوضاع الثلاثة",
    files: ["amr/modes.ts", "amr/logic.test.ts"],
    did: [
      "تنفيذ التشفير وفك التشفير بـECB وCBC وCTR من خلال مكتبة @noble/ciphers.",
      "تعطيل الـPadding، لأن الصفوف مستكملة مسبقًا.",
      "اختبار مطابقة النتائج لأمثلة NIST SP 800-38A، وظهور blocks مكررة مع ECB فقط.",
    ],
  },
  {
    name: "كريم وحيد ابراهيم غانم",
    id: "404066",
    icon: FileLockedIcon,
    role: "تمثيل الصورة المشفرة بصيغة PNG",
    files: ["karim/cipher-png.ts"],
    did: [
      "تخزين الـciphertext كاملًا في ملف PNG يمكن فتحه بأي عارض صور دون فقد أي byte.",
      "إضافة footer مشفر يحتوي على signature وأبعاد الصورة.",
      "إظهار رسالة خطأ عند استخدام Key أو Mode غير صحيح، لأن الـsignature لا تتطابق، مع اختبار ذلك.",
    ],
  },
];

const FACTS = [
  {
    icon: LibraryIcon,
    term: "المكتبة",
    value: (
      <>
        <span dir="ltr">@noble/ciphers</span> بلغة TypeScript
      </>
    ),
  },
  {
    icon: Key01Icon,
    term: "المفتاح",
    value: (
      <>
        <span dir="ltr">AES-256</span>، يُولَّد عشوائيًا أو يُشتق من عبارة سرية
        وSalt
      </>
    ),
  },
  {
    icon: BrowserIcon,
    term: "بيئة التنفيذ",
    value: "داخل المتصفح، دون إرسال الصورة أو المفتاح إلى أي server",
  },
  {
    icon: Image01Icon,
    term: "الاختبار",
    value: "صورتا التكليف (البطريق وأليس)، بالإضافة إلى أي صورة أخرى",
  },
];

const FLOW = [
  "تحويل الصورة إلى بكسلات، واستكمال كل صف ليصبح مضاعفًا لـ16 byte.",
  "تجهيز Key بطول 256 bit، ومعه IV أو Counter بحسب الـMode.",
  "تشفير البيانات بـAES باستخدام الـMode المختار.",
  "حفظ الـciphertext كاملًا في ملف PNG قابل للعرض.",
  "فك التشفير بعكس المراحل، ثم مقارنة البكسلات بالأصل.",
];

// مثال توضيحي: plaintext فيه blocks مكررة (A A B B A A B B).
// ECB يحافظ على التكرار، وCBC وCTR يخفيانه.
const PLAIN = ["a", "a", "b", "b", "a", "a", "b", "b"];

const MODES = [
  {
    mode: "ECB",
    full: "Electronic Codebook",
    inputs: ["Key"],
    padding: "مطلوب",
    enc: ["Cᵢ = E_K(Pᵢ)"],
    dec: ["Pᵢ = D_K(Cᵢ)"],
    look: "الـblocks المتطابقة تعطي ciphertext blocks متطابقة، فيظل شكل الصورة ظاهرًا.",
    cipher: ["x", "x", "y", "y", "x", "x", "y", "y"],
    hides: false,
  },
  {
    mode: "CBC",
    full: "Cipher Block Chaining",
    inputs: ["Key", "IV"],
    padding: "مطلوب",
    enc: ["Cᵢ = E_K(Pᵢ ⊕ Cᵢ₋₁)", "C₀ = IV"],
    dec: ["Pᵢ = D_K(Cᵢ) ⊕ Cᵢ₋₁"],
    look: "كل block يرتبط بالـciphertext block السابق، فيختفي النمط.",
    cipher: ["1", "2", "3", "4", "5", "6", "7", "8"],
    hides: true,
  },
  {
    mode: "CTR",
    full: "Counter",
    inputs: ["Key", "Counter"],
    padding: "غير مطلوب",
    enc: ["Cᵢ = Pᵢ ⊕ E_K(Tᵢ)", "Tᵢ = Counter + i"],
    dec: ["Pᵢ = Cᵢ ⊕ E_K(Tᵢ)"],
    look: "يُشفَّر الـCounter ثم يُدمج مع البيانات بـXOR، وفك التشفير هو العملية نفسها.",
    cipher: ["3", "7", "1", "5", "8", "2", "6", "4"],
    hides: true,
  },
];

const CHECKS = [
  <>
    تطابق الـciphertext في الـModes الثلاثة مع أمثلة{" "}
    <span dir="ltr">NIST SP 800-38A</span>.
  </>,
  "تطابق الصورتين بعد فك التشفير مع الأصل pixel by pixel، في الـModes الثلاثة.",
  "ظهور رسالة خطأ عند استخدام Key أو Mode غير صحيح، بدلًا من إخراج صورة تالفة.",
  "ظهور blocks مكررة في صورة البطريق مع ECB، وعدم ظهورها مع CBC وCTR.",
];

export default function About() {
  return (
    <div className="ab-scroll">
      <main className="ab">
        <header className="ab-head">
          <p className="ab-kicker">SCE 422e · Course Project</p>
          <h1>تشفير الصور وفك تشفيرها باستخدام AES</h1>
          <p className="ab-lead">
            تطبيق ويب يشفّر أي صورة ويفك تشفيرها بأوضاع{" "}
            <span dir="ltr">ECB · CBC · CTR</span>. تُحفظ الصورة المشفرة بصيغة
            PNG قابلة للعرض، وعند فك تشفيرها بالمفتاح نفسه تُستعاد الصورة
            الأصلية مطابقةً pixel by pixel.
          </p>
          <Link className="ab-open" href="/">
            فتح التطبيق
            <Ico icon={ArrowLeft02Icon} size={16} />
          </Link>
        </header>

        <section>
          <h2>
            <Ico icon={InformationCircleIcon} />
            نظرة عامة
          </h2>
          <dl className="ab-facts">
            {FACTS.map((f) => (
              <div key={f.term}>
                <span className="ab-fact-icon">
                  <Ico icon={f.icon} size={17} />
                </span>
                <div>
                  <dt>{f.term}</dt>
                  <dd>{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2>
            <Ico icon={WorkflowSquare03Icon} />
            مراحل المعالجة
          </h2>
          <ol className="ab-flow">
            {FLOW.map((step, i) => (
              <li key={i}>
                <b>{i + 1}</b>
                {step}
              </li>
            ))}
          </ol>
          <p className="ab-note">
            المراحل 1 إلى 4 بأرقام الأعضاء في قسم فريق العمل، والمرحلة 5 عكسها.
          </p>
        </section>

        <section>
          <h2>
            <Ico icon={Layers01Icon} />
            أوضاع التشفير
          </h2>
          <div className="ab-modes">
            {MODES.map((m) => (
              <article key={m.mode} className="ab-mode">
                <div className="ab-mode-id">
                  <strong dir="ltr">{m.mode}</strong>
                  <span dir="ltr">{m.full}</span>
                  <div className="ab-chips">
                    {m.inputs.map((x) => (
                      <code key={x} dir="ltr">
                        {x}
                      </code>
                    ))}
                  </div>
                  <span className="ab-pad">Padding: {m.padding}</span>
                </div>
                <div className="ab-mode-body">
                  <div className="ab-eqs">
                    <div>
                      <span className="ab-eq-label">التشفير</span>
                      {m.enc.map((e) => (
                        <div key={e} className="ab-eq" dir="ltr">
                          {e}
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="ab-eq-label">فك التشفير</span>
                      {m.dec.map((e) => (
                        <div key={e} className="ab-eq" dir="ltr">
                          {e}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p>{m.look}</p>
                  <div className="ab-strip" aria-hidden="true">
                    <div>
                      <span>الأصل</span>
                      <i className="row" dir="ltr">
                        {PLAIN.map((c, i) => (
                          <b key={i} data-c={c} />
                        ))}
                      </i>
                    </div>
                    <div>
                      <span>المشفر</span>
                      <i className="row" dir="ltr">
                        {m.cipher.map((c, i) => (
                          <b key={i} data-c={c} />
                        ))}
                      </i>
                    </div>
                    <em data-hides={m.hides}>
                      {m.hides ? "النمط مخفي" : "النمط ظاهر"}
                    </em>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="ab-note">
            حجم الـblock في AES ثابت (16 byte)، ويقتصر الاختلاف بين الـModes على
            طريقة ربط الـblocks ببعضها.
          </p>
        </section>

        <section>
          <h2>
            <Ico icon={UserGroupIcon} />
            فريق العمل
          </h2>
          <p className="ab-note">
            الواجهة عمل مشترك بين أعضاء الفريق، وقد وُزِّعت مراحل الـlogic في{" "}
            <span dir="ltr">logic/</span> على النحو التالي.
          </p>
          <div className="ab-team">
            {TEAM.map((m, i) => (
              <article key={m.id} className="ab-member">
                <div className="ab-member-top">
                  <b className="ab-num">{i + 1}</b>
                  <div>
                    <h3>{m.name}</h3>
                    <span className="ab-id">
                      <Ico icon={IdIcon} size={13} />
                      <span dir="ltr">{m.id}</span>
                    </span>
                  </div>
                </div>
                <p className="ab-role">
                  <Ico icon={m.icon} size={16} />
                  {m.role}
                </p>
                <ul>
                  {m.did.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="ab-files" dir="ltr">
                  {m.files.map((f) => (
                    <code key={f}>{f}</code>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>
            <Ico icon={TestTube01Icon} />
            التحقق من صحة التنفيذ
          </h2>
          <ul className="ab-checks">
            {CHECKS.map((c, i) => (
              <li key={i}>
                <Ico icon={CheckmarkCircle02Icon} size={16} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
