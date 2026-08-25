const AUTOMATION_RULES = [
    {
        event: 'LEAD_CREATED',
        name: 'New Lead Customer & Team Alert',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'NEW_ENQUIRY_CONFIRMATION',
                channel: 'WHATSAPP'
            },
            {
                targetType: 'MANAGER',
                templateId: 'MANAGER_NEW_LEAD_ALERT',
                channel: 'BOTH'
            }
        ]
    },
    {
        event: 'QUOTE_SENT',
        name: 'Quote Sent Customer Alert',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'QUOTE_READY',
                channel: 'WHATSAPP'
            }
        ]
    },
    {
        event: 'BOOKING_CONFIRMED',
        name: 'Booking Confirmation Receipt',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'BOOKING_CONFIRMATION',
                channel: 'BOTH'
            }
        ]
    },
    {
        event: 'PAYMENT_RECEIVED',
        name: 'Payment Receipt Confirmation',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'PAYMENT_RECEIPT',
                channel: 'BOTH'
            }
        ]
    },
    {
        event: 'PAYMENT_DUE',
        name: 'Payment Due Followup Reminder',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'PAYMENT_REMINDER',
                channel: 'WHATSAPP'
            }
        ]
    },
    {
        event: 'TRIP_UPCOMING',
        name: 'Upcoming Trip & Driver Notification',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'TRIP_REMINDER',
                channel: 'WHATSAPP'
            }
        ]
    },
    {
        event: 'TRIP_COMPLETED',
        name: 'Trip Completed Feedback Request',
        enabled: true,
        actions: [
            {
                targetType: 'CUSTOMER',
                templateId: 'TRIP_COMPLETED',
                channel: 'WHATSAPP'
            }
        ]
    }
];

function getRuleForEvent(eventType) {
    return AUTOMATION_RULES.find(r => r.event === eventType && r.enabled);
}

module.exports = {
    AUTOMATION_RULES,
    getRuleForEvent
};
