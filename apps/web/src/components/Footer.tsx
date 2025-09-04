export function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-white">
                                    サプティア
                                </span>
                                <span className="text-xs text-gray-400 font-medium -mt-1">
                                    Suptia
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                            あなたに最も合うサプリを最も安い価格で。科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポートします。
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="mailto:contact@suptia.com"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                                aria-label="メールでお問い合わせ"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                                aria-label="Twitter"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                                aria-label="Instagram"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* サプティアについて */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-white">サプティアについて</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="/about" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    サプティアとは
                                </a>
                            </li>
                            <li>
                                <a href="/ingredients" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    成分ガイド
                                </a>
                            </li>
                            <li>
                                <a href="/compare" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    人気比較
                                </a>
                            </li>
                            <li>
                                <a href="/mypage" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    マイページ
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* サポート・法的情報 */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-white">サポート・法的情報</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    お問い合わせ
                                </a>
                            </li>
                            <li>
                                <a href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    プライバシーポリシー
                                </a>
                            </li>
                            <li>
                                <a href="/legal/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    利用規約
                                </a>
                            </li>
                            <li>
                                <a href="/legal/disclaimer" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    免責事項
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-800 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                            <p className="text-gray-400 text-sm">
                                © 2025 サプティア (Suptia). All rights reserved.
                            </p>
                            <p className="text-gray-500 text-xs">
                                本サービスは医療アドバイスを提供するものではありません
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <span>Made with</span>
                            <span className="text-red-400">❤️</span>
                            <span>for better health decisions</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
