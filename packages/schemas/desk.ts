import { StructureBuilder } from 'sanity/desk';

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('コンテンツ管理')
    .items([
      // 成分管理
      S.listItem()
        .title('成分')
        .icon(() => '🧪')
        .child(
          S.list()
            .title('成分管理')
            .items([
              S.listItem()
                .title('全ての成分')
                .child(S.documentTypeList('ingredient').title('全ての成分')),
              S.listItem()
                .title('カテゴリー別')
                .child(
                  S.list()
                    .title('カテゴリー別成分')
                    .items([
                      S.listItem()
                        .title('ビタミン')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('ビタミン')
                            .filter(
                              '_type == "ingredient" && category == "vitamin"'
                            )
                        ),
                      S.listItem()
                        .title('ミネラル')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('ミネラル')
                            .filter(
                              '_type == "ingredient" && category == "mineral"'
                            )
                        ),
                      S.listItem()
                        .title('ハーブ')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('ハーブ')
                            .filter(
                              '_type == "ingredient" && category == "herb"'
                            )
                        ),
                      S.listItem()
                        .title('アミノ酸')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('アミノ酸')
                            .filter(
                              '_type == "ingredient" && category == "amino"'
                            )
                        ),
                    ])
                ),
              S.listItem()
                .title('エビデンスレベル別')
                .child(
                  S.list()
                    .title('エビデンスレベル別')
                    .items([
                      S.listItem()
                        .title('Aレベル（高品質）')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('Aレベル成分')
                            .filter(
                              '_type == "ingredient" && evidenceLevel == "A"'
                            )
                        ),
                      S.listItem()
                        .title('Bレベル（中程度）')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('Bレベル成分')
                            .filter(
                              '_type == "ingredient" && evidenceLevel == "B"'
                            )
                        ),
                      S.listItem()
                        .title('Cレベル（限定的）')
                        .child(
                          S.documentTypeList('ingredient')
                            .title('Cレベル成分')
                            .filter(
                              '_type == "ingredient" && evidenceLevel == "C"'
                            )
                        ),
                    ])
                ),
            ])
        ),

      // カテゴリ管理
      S.listItem()
        .title('カテゴリ')
        .icon(() => '🏷️')
        .child(
          S.list()
            .title('カテゴリ管理')
            .items([
              S.listItem()
                .title('全てのカテゴリ')
                .child(S.documentTypeList('category').title('全てのカテゴリ')),
              S.listItem()
                .title('人気カテゴリ')
                .child(
                  S.documentTypeList('category')
                    .title('人気カテゴリ')
                    .filter('_type == "category" && isPopular == true')
                ),
              S.listItem()
                .title('表示順序別')
                .child(
                  S.documentTypeList('category')
                    .title('表示順序別')
                    .defaultOrdering([
                      { field: 'displayOrder', direction: 'asc' },
                    ])
                ),
            ])
        ),

      // 商品管理
      S.listItem()
        .title('商品')
        .icon(() => '📦')
        .child(
          S.list()
            .title('商品管理')
            .items([
              S.listItem()
                .title('全ての商品')
                .child(S.documentTypeList('product').title('全ての商品')),
              S.listItem()
                .title('カテゴリ別')
                .child(
                  S.list()
                    .title('カテゴリ別商品')
                    .items([
                      S.listItem()
                        .title('ビタミンD')
                        .child(
                          S.documentTypeList('product')
                            .title('ビタミンD商品')
                            .filter(
                              '_type == "product" && category->slug.current == "vitamin-d"'
                            )
                        ),
                      S.listItem()
                        .title('プロテイン')
                        .child(
                          S.documentTypeList('product')
                            .title('プロテイン商品')
                            .filter(
                              '_type == "product" && category->slug.current == "protein"'
                            )
                        ),
                      S.listItem()
                        .title('マルチビタミン')
                        .child(
                          S.documentTypeList('product')
                            .title('マルチビタミン商品')
                            .filter(
                              '_type == "product" && category->slug.current == "multivitamin"'
                            )
                        ),
                      S.listItem()
                        .title('オメガ3')
                        .child(
                          S.documentTypeList('product')
                            .title('オメガ3商品')
                            .filter(
                              '_type == "product" && category->slug.current == "omega-3"'
                            )
                        ),
                      S.listItem()
                        .title('コラーゲン')
                        .child(
                          S.documentTypeList('product')
                            .title('コラーゲン商品')
                            .filter(
                              '_type == "product" && category->slug.current == "collagen"'
                            )
                        ),
                      S.listItem()
                        .title('鉄分')
                        .child(
                          S.documentTypeList('product')
                            .title('鉄分商品')
                            .filter(
                              '_type == "product" && category->slug.current == "iron"'
                            )
                        ),
                    ])
                ),
              S.listItem()
                .title('価格帯別')
                .child(
                  S.list()
                    .title('価格帯別商品')
                    .items([
                      S.listItem()
                        .title('〜2,000円')
                        .child(
                          S.documentTypeList('product')
                            .title('〜2,000円')
                            .filter('_type == "product" && priceJPY <= 2000')
                        ),
                      S.listItem()
                        .title('2,001円〜5,000円')
                        .child(
                          S.documentTypeList('product')
                            .title('2,001円〜5,000円')
                            .filter(
                              '_type == "product" && priceJPY > 2000 && priceJPY <= 5000'
                            )
                        ),
                      S.listItem()
                        .title('5,001円〜')
                        .child(
                          S.documentTypeList('product')
                            .title('5,001円〜')
                            .filter('_type == "product" && priceJPY > 5000')
                        ),
                    ])
                ),
              S.listItem()
                .title('第三者機関検査済み')
                .child(
                  S.documentTypeList('product')
                    .title('第三者機関検査済み商品')
                    .filter('_type == "product" && thirdPartyTested == true')
                ),
            ])
        ),

      // エビデンス管理
      S.listItem()
        .title('エビデンス')
        .icon(() => '📊')
        .child(
          S.list()
            .title('エビデンス管理')
            .items([
              S.listItem()
                .title('全てのエビデンス')
                .child(
                  S.documentTypeList('evidence').title('全てのエビデンス')
                ),
              S.listItem()
                .title('研究タイプ別')
                .child(
                  S.list()
                    .title('研究タイプ別')
                    .items([
                      S.listItem()
                        .title('RCT')
                        .child(
                          S.documentTypeList('evidence')
                            .title('ランダム化比較試験')
                            .filter('_type == "evidence" && studyType == "RCT"')
                        ),
                      S.listItem()
                        .title('メタ分析')
                        .child(
                          S.documentTypeList('evidence')
                            .title('メタ分析')
                            .filter(
                              '_type == "evidence" && studyType == "meta-analysis"'
                            )
                        ),
                      S.listItem()
                        .title('システマティックレビュー')
                        .child(
                          S.documentTypeList('evidence')
                            .title('システマティックレビュー')
                            .filter(
                              '_type == "evidence" && studyType == "systematic-review"'
                            )
                        ),
                    ])
                ),
              S.listItem()
                .title('グレード別')
                .child(
                  S.list()
                    .title('エビデンスグレード別')
                    .items([
                      S.listItem()
                        .title('Aグレード')
                        .child(
                          S.documentTypeList('evidence')
                            .title('Aグレード')
                            .filter('_type == "evidence" && grade == "A"')
                        ),
                      S.listItem()
                        .title('Bグレード')
                        .child(
                          S.documentTypeList('evidence')
                            .title('Bグレード')
                            .filter('_type == "evidence" && grade == "B"')
                        ),
                      S.listItem()
                        .title('Cグレード')
                        .child(
                          S.documentTypeList('evidence')
                            .title('Cグレード')
                            .filter('_type == "evidence" && grade == "C"')
                        ),
                    ])
                ),
            ])
        ),

      // ペルソナ管理
      S.listItem()
        .title('ペルソナ')
        .icon(() => '👥')
        .child(
          S.list()
            .title('ペルソナ管理')
            .items([
              S.listItem()
                .title('全てのペルソナ')
                .child(S.documentTypeList('persona').title('全てのペルソナ')),
              S.listItem()
                .title('タグ別')
                .child(
                  S.list()
                    .title('タグ別ペルソナ')
                    .items([
                      S.listItem()
                        .title('妊娠・授乳中')
                        .child(
                          S.documentTypeList('persona')
                            .title('妊娠・授乳中')
                            .filter(
                              '_type == "persona" && ("pregnancy" in tags || "lactation" in tags)'
                            )
                        ),
                      S.listItem()
                        .title('疾患・服薬中')
                        .child(
                          S.documentTypeList('persona')
                            .title('疾患・服薬中')
                            .filter(
                              '_type == "persona" && ("condition" in tags || "meds" in tags)'
                            )
                        ),
                      S.listItem()
                        .title('刺激物敏感')
                        .child(
                          S.documentTypeList('persona')
                            .title('刺激物敏感')
                            .filter(
                              '_type == "persona" && "stimulantSensitivity" in tags'
                            )
                        ),
                    ])
                ),
            ])
        ),

      // ルール管理
      S.listItem()
        .title('コンプライアンスルール')
        .icon(() => '⚠️')
        .child(
          S.list()
            .title('ルール管理')
            .items([
              S.listItem()
                .title('全てのルール')
                .child(S.documentTypeList('rule').title('全てのルール')),
              S.listItem()
                .title('重要度別')
                .child(
                  S.list()
                    .title('重要度別ルール')
                    .items([
                      S.listItem()
                        .title('高（禁忌）')
                        .child(
                          S.documentTypeList('rule')
                            .title('高重要度ルール')
                            .filter('_type == "rule" && severity == "high"')
                        ),
                      S.listItem()
                        .title('中（要注意）')
                        .child(
                          S.documentTypeList('rule')
                            .title('中重要度ルール')
                            .filter('_type == "rule" && severity == "medium"')
                        ),
                      S.listItem()
                        .title('低（注意喚起）')
                        .child(
                          S.documentTypeList('rule')
                            .title('低重要度ルール')
                            .filter('_type == "rule" && severity == "low"')
                        ),
                    ])
                ),
              S.listItem()
                .title('アクティブなルール')
                .child(
                  S.documentTypeList('rule')
                    .title('アクティブなルール')
                    .filter('_type == "rule" && isActive == true')
                ),
            ])
        ),

      // 区切り線
      S.divider(),

      // 設定・その他
      S.listItem()
        .title('設定')
        .icon(() => '⚙️')
        .child(
          S.list()
            .title('設定')
            .items([
              S.listItem()
                .title('データ統計')
                .child(
                  S.component()
                    .title('データ統計')
                    .component(() => {
                      return {
                        type: 'div',
                        props: {
                          style: { padding: '20px' },
                          children: [
                            {
                              type: 'h2',
                              props: { children: 'データ統計（開発予定）' },
                            },
                            {
                              type: 'p',
                              props: {
                                children:
                                  '成分数、商品数、エビデンス数などの統計情報を表示予定',
                              },
                            },
                          ],
                        },
                      };
                    })
                ),
            ])
        ),
    ]);
