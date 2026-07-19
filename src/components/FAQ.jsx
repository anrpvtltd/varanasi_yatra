import React, { useState } from 'react';

export default function FAQ() {
    const faqList = [
        {
            q: "Do you provide airport pickup and drop-off services in Varanasi?",
            a: "Yes, we provide 24/7 dedicated airport and railway station pickup and drop-off in comfortable AC vehicles. Our driver will meet you directly at the arrivals terminal to ensure a seamless transfer to your hotel."
        },
        {
            q: "Can you arrange hotel accommodations close to the ghats?",
            a: "Absolutely! We arrange clean, family-friendly hotel and guesthouse stays close to the Kashi Vishwanath corridor and major ghats. You can choose from budget to luxury boutique stays featuring pure vegetarian dining options."
        },
        {
            q: "Are Ganga Aarti and morning boat rides included in the tour packages?",
            a: "Yes, both the morning sunrise boat ride (Subah-e-Banaras) and the evening Ganga Aarti private boat rides are standard features of our main travel itineraries. We can customize them to be private boat rides or shared cruises."
        },
        {
            q: "Do you assist with VIP Darshan tickets at Kashi Vishwanath Temple?",
            a: "Yes, we help organize fast-track VIP Darshan tickets and coordinate local guides to assist senior citizens and families through the temple corridor smoothly, avoiding long queue wait times."
        },
        {
            q: "What is your booking cancellation and refund policy?",
            a: "As a customer-first startup, we offer flexible terms. Cancellations made 7 days prior to travel receive a full refund of the token advance. For cancellations made within 7 days, the advance is adjusted for future bookings. See our Refund Policy page for details."
        },
        {
            q: "What payment methods do you accept, and do we need to pay in advance?",
            a: "We accept UPI payments (GPay, PhonePe, Paytm), credit/debit cards, and direct bank transfers. We only request a minimal token advance to secure your hotel room and taxi booking, and the balance is payable during the tour."
        },
        {
            q: "Can we customize our tour to include day trips to Ayodhya or Bodh Gaya?",
            a: "Yes! All of our tour plans are 100% customizable. We specialize in designing spiritual circuit extensions to nearby destinations including Ayodhya (Ram Mandir), Bodh Gaya, Mirzapur (Vindhyachal Temple), and Chunar Fort."
        },
        {
            q: "Do you provide professional local tour guides?",
            a: "Yes, we connect you with certified, knowledgeable local guides who are well-versed in the history, myths, and architecture of Varanasi. Guides speak English and Hindi, ensuring an educational and enriching visit."
        },
        {
            q: "Is traveling in Varanasi safe for solo travelers and senior citizens?",
            a: "Varanasi is safe and highly welcoming to pilgrims. Our tours provide dedicated private cars, vetted professional drivers, and guides who remain with your group, making it extremely secure and comfortable for senior citizens and solo travelers."
        },
        {
            q: "How can we reach your support team during our trip?",
            a: "We offer round-the-clock 24/7 travel support. Once you book, you will be assigned a dedicated travel coordinator who will be reachable via phone and WhatsApp (+91-8149783494) at any time to assist you instantly."
        }
    ];

    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 bg-stone-50 text-stone-800 select-none">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                {/* Heading Block */}
                <div className="text-center mb-12">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Common Queries</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mt-3 mb-2">Frequently Asked Questions</h2>
                    <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                    <p className="text-stone-500 text-xs sm:text-sm max-w-lg mx-auto">Got questions about planning your spiritual journey? Here are quick answers to our most frequently asked queries.</p>
                </div>

                {/* Accordion Layout */}
                <div className="space-y-3">
                    {faqList.map((faq, i) => {
                        const isOpen = activeIndex === i;
                        return (
                            <div 
                                key={i} 
                                className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-xs transition-all duration-300 hover:border-orange-200"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion(i)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-xs sm:text-sm font-bold text-stone-900 tracking-wide font-serif">
                                        {faq.q}
                                    </span>
                                    <span className={`ml-4 flex-shrink-0 text-orange-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </button>
                                
                                <div 
                                    className={`transition-all duration-300 overflow-hidden ${
                                        isOpen ? 'max-h-48 border-t border-stone-100' : 'max-h-0'
                                    }`}
                                >
                                    <div className="px-6 py-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
