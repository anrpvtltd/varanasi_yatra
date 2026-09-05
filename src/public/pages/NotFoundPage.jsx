import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';

export default function NotFoundPage() {
    return (
        <>
            <SEO
                title="Page Not Found (404) | Varanasi Yatra"
                description="The page you are looking for does not exist. Explore authentic Varanasi experiences, tours, and travel guides on Varanasi Yatra."
                pathname="/404"
            />

            <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-16 text-center">
                <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm">
                    <span className="text-amber-600 font-serif font-black text-6xl sm:text-7xl block mb-2">
                        404
                    </span>
                    <span className="text-xs uppercase font-bold tracking-widest text-stone-500 bg-stone-100 px-3 py-1 rounded-full inline-block mb-4">
                        Page Not Found
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-3">
                        Lost in the Alleys of Kashi?
                    </h1>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Just like the ancient winding galis of Varanasi, sometimes you take an unexpected turn. The page or URL you requested cannot be found.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                        <Link
                            to="/"
                            className="w-full sm:w-auto bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-sm"
                        >
                            Return Home
                        </Link>
                        <Link
                            to="/plan-your-trip"
                            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-sm"
                        >
                            Plan My Trip
                        </Link>
                    </div>

                    <div className="pt-6 border-t border-stone-100">
                        <span className="text-xs font-bold text-stone-700 block mb-2">
                            Popular Useful Pages:
                        </span>
                        <div className="flex flex-wrap justify-center gap-3 text-xs">
                            <Link to="/experiences" className="text-amber-700 hover:underline">
                                Experiences
                            </Link>
                            <span className="text-stone-300">•</span>
                            <Link to="/tours" className="text-amber-700 hover:underline">
                                Tour Packages
                            </Link>
                            <span className="text-stone-300">•</span>
                            <Link to="/travel-guide" className="text-amber-700 hover:underline">
                                Travel Guide
                            </Link>
                            <span className="text-stone-300">•</span>
                            <Link to="/hotels" className="text-amber-700 hover:underline">
                                Hotels
                            </Link>
                            <span className="text-stone-300">•</span>
                            <Link to="/contact" className="text-amber-700 hover:underline">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
