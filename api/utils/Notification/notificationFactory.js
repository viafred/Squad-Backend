const NotificationOfferCreated = require('./notificationOfferCreated')


class NotificationFactory {
    static create (type) {
        if (type === 'offer_created') {
            return new NotificationOfferCreated()
        }

        throw new Error('Invalid Notification Type')
    }
}

module.exports = NotificationFactory