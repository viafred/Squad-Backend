const NotificationOfferCreated = require('./notificationOfferCreated')
const NotificationOfferEarned = require('./notificationOfferEarned')


class NotificationFactory {
    static create (type) {
        if (type === 'offer_created') {
            return new NotificationOfferCreated()
        }

        if (type === 'offer_earned_amount') {
            return new NotificationOfferEarned()
        }

        throw new Error('Invalid Notification Type')
    }
}

module.exports = NotificationFactory