import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import ExperienceCard from '../components/ExperienceCard';
import { EXPERIENCES } from '../data/experiencesData';

export default function ExperiencesHubPage() {
    return (
        <>
            <SEO
                title="Varanasi Experiences | Ganga Aarti, Boat Rides & Darshan | Varanasi Yatra"
                description="Explore curated Varanasi experiences. Private morning & evening boat rides, Kashi Vishwanath Sugam Darshan, Sarnath heritage walks, and authentic local food trails."
                pathname="/experiences"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Experiences' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-10">
                    <SectionHeading
                        as="h1"
                        eyebrow="Immersive Kashi Activities"
                        title="Varanasi Experiences & Sacred Activities"
                        description="Varanasi is not a museum; it is a living river of devotion, heritage, and timeless sensory energy. Explore our handpicked local experiences guided by verified boatmen and respectful local escorts."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {EXPERIENCES.map((exp) => (
                        <ExperienceCard key={exp.slug} experience={exp} />
                    ))}
                </div>

                {/* Bottom Custom Experience CTA */}
                <div className="mt-14 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 sm:p-10 border border-amber-200/70 text-center max-w-3xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
                        Looking for a Custom Private Experience?
                    </h2>
                    <p className="text-stone-600 text-xs sm:text-sm mb-6 max-w-xl mx-auto">
                        Whether you require private boat charter for family rituals, special elderly assistance at the temple corridor, or early morning photography permits, we coordinate it all.
                    </p>
                    <Link
                        to="/plan-your-trip"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md inline-block"
                    >
                        Plan Custom Experience
                    </Link>
                </div>
            </div>
        </>
    );
}
