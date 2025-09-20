import type { Metadata } from 'next';

const faqItems = [
  {
    question: '診断結果はどのように作成されていますか？',
    answer:
      '診断フォームでいただいた回答をもとに、AI がサプリメントの成分・エビデンス・価格を多角的にスコアリングして提案します。',
  },
  {
    question: '検査情報のない商品も掲載されていますか？',
    answer:
      'GMP/ISO などの検査証明が確認できない場合は「検査情報なし」として表示し、ユーザーが判別しやすいようにしています。',
  },
  {
    question: '法人向けの連携やデータ提供は可能ですか？',
    answer:
      'パートナー向け API やレポート提供を準備しています。下記「パートナー募集」の窓口までお問い合わせください。',
  },
];

export const metadata: Metadata = {
  title: 'お問い合わせ - サプティア',
  description:
    'サプティアへのお問い合わせページです。ご質問やご要望をお気軽にお寄せください。',
};

export default function ContactPage() {
  return (
    <div className='bg-surface-subtle'>
      <div className='mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8'>
        <section className='text-center'>
          <h1 className='text-3xl font-semibold text-[#1f242f] sm:text-4xl'>
            お問い合わせ
          </h1>
          <p className='mt-4 text-base text-neutral-600'>
            ご質問・ご要望・パートナーシップに関するお問い合わせは、以下のフォームまたは各窓口までご連絡ください。
          </p>
        </section>

        <section className='grid gap-10 lg:grid-cols-2'>
          <div className='rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'>
            <h2 className='text-xl font-semibold text-[#1f242f]'>
              メッセージを送信
            </h2>
            <form className='mt-6 space-y-6'>
              <label className='block text-sm font-semibold text-neutral-600'>
                お名前<span className='ml-1 text-primary-500'>*</span>
                <input
                  className='mt-2 w-full rounded-[12px] border border-[#cfd3d8] px-3 py-2 text-sm text-neutral-700 focus:border-trivago-blue focus:outline-none focus:ring-1 focus:ring-trivago-blue'
                  required
                  type='text'
                  name='name'
                  autoComplete='name'
                />
              </label>
              <label className='block text-sm font-semibold text-neutral-600'>
                メールアドレス<span className='ml-1 text-primary-500'>*</span>
                <input
                  className='mt-2 w-full rounded-[12px] border border-[#cfd3d8] px-3 py-2 text-sm text-neutral-700 focus:border-trivago-blue focus:outline-none focus:ring-1 focus:ring-trivago-blue'
                  required
                  type='email'
                  name='email'
                  autoComplete='email'
                />
              </label>
              <label className='block text-sm font-semibold text-neutral-600'>
                件名<span className='ml-1 text-primary-500'>*</span>
                <select
                  className='mt-2 w-full rounded-[12px] border border-[#cfd3d8] px-3 py-2 text-sm text-neutral-700 focus:border-trivago-blue focus:outline-none focus:ring-1 focus:ring-trivago-blue'
                  required
                  name='subject'
                  defaultValue=''
                >
                  <option value='' disabled>
                    選択してください
                  </option>
                  <option value='general'>一般的なお問い合わせ</option>
                  <option value='technical'>技術的なご相談</option>
                  <option value='feature'>機能に関するご要望</option>
                  <option value='business'>ビジネス・提携について</option>
                  <option value='other'>その他</option>
                </select>
              </label>
              <label className='block text-sm font-semibold text-neutral-600'>
                メッセージ<span className='ml-1 text-primary-500'>*</span>
                <textarea
                  className='mt-2 h-32 w-full rounded-[12px] border border-[#cfd3d8] px-3 py-2 text-sm text-neutral-700 focus:border-trivago-blue focus:outline-none focus:ring-1 focus:ring-trivago-blue'
                  required
                  name='message'
                  placeholder='お問い合わせ内容をご記入ください'
                />
              </label>
              <button
                className='w-full rounded-pill bg-primary-500 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-trivago hover:bg-primary-600'
                type='submit'
              >
                送信する
              </button>
            </form>
          </div>

          <section
            id='help'
            className='space-y-6 rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'
          >
            <h2 className='text-xl font-semibold text-[#1f242f]'>
              サポート窓口
            </h2>
            <div className='space-y-5 text-sm text-neutral-600'>
              <div>
                <p className='font-semibold text-neutral-700'>メール</p>
                <p className='mt-1'>
                  一般的なお問い合わせ:{' '}
                  <a
                    className='text-primary-600 hover:text-primary-700'
                    href='mailto:contact@suptia.com'
                  >
                    contact@suptia.com
                  </a>
                </p>
                <p>
                  技術サポート:{' '}
                  <a
                    className='text-primary-600 hover:text-primary-700'
                    href='mailto:support@suptia.com'
                  >
                    support@suptia.com
                  </a>
                </p>
              </div>
              <div>
                <p className='font-semibold text-neutral-700'>受付時間</p>
                <p className='mt-1'>
                  平日 9:00 - 18:00（日本時間）
                  <br />
                  土日祝日は翌営業日に順次回答いたします。
                </p>
              </div>
              <div>
                <p className='font-semibold text-neutral-700'>
                  迅速な回答のために
                </p>
                <ul className='mt-1 space-y-1 text-neutral-600'>
                  <li>• 具体的な事象と再現手順をご記載ください。</li>
                  <li>
                    • 技術的なご相談はご利用環境も併記いただくとスムーズです。
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </section>

        <section
          id='faq'
          className='space-y-6 rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'
        >
          <h2 className='text-xl font-semibold text-[#1f242f]'>よくある質問</h2>
          <div className='space-y-4'>
            {faqItems.map(item => (
              <details
                key={item.question}
                className='rounded-[12px] border border-[#f1f3f5] bg-neutral-50 p-4'
              >
                <summary className='cursor-pointer text-sm font-semibold text-[#1f242f]'>
                  {item.question}
                </summary>
                <p className='mt-2 text-sm text-neutral-600'>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          id='partners'
          className='space-y-6 rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'
        >
          <h2 className='text-xl font-semibold text-[#1f242f]'>
            パートナー募集
          </h2>
          <p className='text-sm text-neutral-600'>
            EC
            事業者・メーカー・メディア事業者との提携を歓迎しています。価格フィード連携、タイアップ企画、データ提供など柔軟に対応可能です。
            下記窓口よりお気軽にご相談ください。
          </p>
          <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-6 text-sm text-neutral-600'>
            <p className='font-semibold text-[#1f242f]'>連絡先</p>
            <p className='mt-2'>
              パートナーシップ専用メール:{' '}
              <a
                className='text-primary-600 hover:text-primary-700'
                href='mailto:partners@suptia.com'
              >
                partners@suptia.com
              </a>
            </p>
            <p className='mt-2'>想定している取り組み例:</p>
            <ul className='mt-1 space-y-1'>
              <li>• サイト間価格同期・在庫連携</li>
              <li>• ターゲット別プロモーション / クーポン配信</li>
              <li>• 調査レポート・セミナー共同開催</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
