import type { Metadata } from 'next';

const features = [
  {
    title: '科学的根拠に基づく分析',
    description:
      '査読付き論文や臨床試験データを参照し、各成分のエビデンスと安全性を定量的に評価します。',
    iconColor: 'text-primary-600',
    iconBg: 'bg-blue-100',
    iconPath:
      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    title: '価格最適化エンジン',
    description:
      '主要ECサイトの価格・送料・クーポン情報を集約。実効コスト/日を自動算出し、最適な買い時を提示します。',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    iconPath:
      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: '個人最適化レコメンド',
    description:
      '年齢・体質・ライフスタイルからAIがスコアリング。重複や過剰摂取を避けた安全な組み合わせを提案します。',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    iconPath:
      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    title: '第三者検査の可視化',
    description:
      'GMP・ISOなどの認証状況をタグとして表示。安心して選べる透明性の高い比較体験を実現しました。',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    iconPath:
      'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
  },
];

const timeline = [
  {
    title: 'サプリの目的を選ぶ',
    description:
      '疲労回復・美容・免疫などの目的を選択すると、関連カテゴリと代表的な成分をレコメンドします。',
  },
  {
    title: 'AIが最適な組み合わせを提案',
    description:
      '重複する成分や過剰摂取のリスクをAIが判定し、安心して始められるプランを提示します。',
  },
  {
    title: '価格比較と購入タイミング',
    description:
      'サイト横断の価格推移と在庫情報をチェック。最安値と購入タイミングを可視化します。',
  },
];

export const metadata: Metadata = {
  title: 'サプティアとは - サプティア',
  description:
    'サプティアは科学的根拠に基づいた分析で、あなたに最も合うサプリを最も安い価格で見つけるサービスです。',
};

export default function AboutPage() {
  return (
    <div className='bg-surface-subtle'>
      <div className='mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8'>
        <section id='overview' className='text-center'>
          <h1 className='text-4xl font-semibold text-[#1f242f] sm:text-5xl'>
            サプティアとは
          </h1>
          <p className='mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl'>
            あなたに最も合うサプリを最も安い価格で。科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポートします。
          </p>
        </section>

        <section
          id='mission'
          className='rounded-[24px] bg-gradient-to-r from-trivago-blue/15 via-trivago-teal/10 to-primary-500/10 p-8 sm:p-10'
        >
          <h2 className='text-2xl font-bold text-[#1f242f]'>
            私たちのミッション
          </h2>
          <p className='mt-4 text-lg leading-relaxed text-neutral-700'>
            膨大な情報と価格差が存在するサプリ市場で、消費者が最適な選択をするのは容易ではありません。サプティアは
            AI と
            科学的データを活用し、個人ニーズに最適化されたサプリメント選択を支援して健康的な生活の実現に貢献します。
          </p>
        </section>

        <section id='features' className='space-y-8'>
          <h2 className='text-2xl font-bold text-[#1f242f] text-center'>
            サプティアの特徴
          </h2>
          <div className='grid gap-6 md:grid-cols-2'>
            {features.map(feature => (
              <div
                key={feature.title}
                className='rounded-[16px] border border-[#e0e0e0] bg-white p-6 shadow-soft'
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}
                >
                  <svg
                    className={`h-6 w-6 ${feature.iconColor}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d={feature.iconPath}
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-[#1f242f]'>
                  {feature.title}
                </h3>
                <p className='mt-2 text-sm leading-relaxed text-neutral-600'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id='how-it-works' className='space-y-8'>
          <h2 className='text-2xl font-bold text-[#1f242f] text-center'>
            サプティアの使い方
          </h2>
          <div className='space-y-6'>
            {timeline.map((item, index) => (
              <div
                key={item.title}
                className='flex items-start gap-4 rounded-[16px] border border-[#e0e0e0] bg-white p-6 shadow-soft'
              >
                <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white'>
                  {index + 1}
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-[#1f242f]'>
                    {item.title}
                  </h3>
                  <p className='mt-2 text-sm text-neutral-600'>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id='careers'
          className='space-y-6 rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'
        >
          <h2 className='text-2xl font-bold text-[#1f242f]'>採用情報</h2>
          <p className='text-sm leading-relaxed text-neutral-600'>
            データサイエンス、プロダクトデザイン、エンジニアリングなど多様な職種で仲間を募集しています。ユーザーの健康行動を支える
            体験づくりに共感いただける方は{' '}
            <a
              className='text-primary-600 hover:text-primary-700'
              href='mailto:careers@suptia.com'
            >
              careers@suptia.com
            </a>{' '}
            までご連絡ください。
          </p>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-6'>
              <h3 className='text-base font-semibold text-[#1f242f]'>
                募集中のポジション
              </h3>
              <ul className='mt-3 space-y-2 text-sm text-neutral-600'>
                <li>• フロントエンドエンジニア（Next.js / TypeScript）</li>
                <li>• データサイエンティスト（サプリ市場インサイト）</li>
                <li>• UI/UX デザイナー（比較体験・診断フロー）</li>
              </ul>
            </div>
            <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-6'>
              <h3 className='text-base font-semibold text-[#1f242f]'>働き方</h3>
              <ul className='mt-3 space-y-2 text-sm text-neutral-600'>
                <li>• フルリモート / ハイブリッド勤務に対応</li>
                <li>• コアタイム無しのフレックスタイム制</li>
                <li>• 最新の検証デバイス・検査サービスを支給</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id='press'
          className='space-y-4 rounded-[24px] border border-[#e0e0e0] bg-white p-8 shadow-soft'
        >
          <h2 className='text-2xl font-bold text-[#1f242f]'>プレスルーム</h2>
          <p className='text-sm leading-relaxed text-neutral-600'>
            メディア掲載・取材・講演依頼に関するお問い合わせは{' '}
            <a
              className='text-primary-600 hover:text-primary-700'
              href='mailto:press@suptia.com'
            >
              press@suptia.com
            </a>{' '}
            までお願いいたします。サービス概要資料や統計レポートの提供も行っています。
          </p>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-5 text-sm text-neutral-600'>
              <h3 className='mb-2 text-base font-semibold text-[#1f242f]'>
                提供リソース
              </h3>
              <ul className='space-y-1'>
                <li>• サービス概要・沿革</li>
                <li>• ブランドロゴ・ガイドライン</li>
                <li>• 市場インサイト資料</li>
              </ul>
            </div>
            <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-5 text-sm text-neutral-600'>
              <h3 className='mb-2 text-base font-semibold text-[#1f242f]'>
                掲載実績
              </h3>
              <p>
                主要メディア・専門誌での掲載例や、カンファレンス登壇情報をまとめています。
              </p>
            </div>
            <div className='rounded-[16px] border border-[#e0e0e0] bg-neutral-50 p-5 text-sm text-neutral-600'>
              <h3 className='mb-2 text-base font-semibold text-[#1f242f]'>
                取材の流れ
              </h3>
              <p>
                取材目的・掲載媒体・締切日を記載のうえご連絡ください。1〜2営業日以内にご返信いたします。
              </p>
            </div>
          </div>
        </section>

        <section className='rounded-[24px] bg-gradient-to-r from-primary-600 to-trivago-teal/90 p-8 text-center text-white shadow-strong'>
          <h2 className='text-2xl font-bold'>今すぐ始めてみませんか？</h2>
          <p className='mt-4 text-base opacity-85'>
            無料診断で、あなたに最適なサプリメントを見つけましょう。
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
            <a
              className='rounded-pill bg-white px-6 py-3 text-sm font-semibold text-primary-600 transition-colors duration-200 ease-trivago hover:bg-neutral-100'
              href='/diagnosis'
            >
              無料診断を始める
            </a>
            <a
              className='rounded-pill border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-trivago hover:bg-white hover:text-primary-600'
              href='/compare'
            >
              商品を比較する
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
