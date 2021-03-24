const NotificationOfferCreated = require('./notificationOfferCreated')
const NotificationOfferEarned = require('./notificationOfferEarned')
const NotificationSuccessfulUpload = require('./notificationSuccessfulUpload')


class NotificationFactory {
    static create (type) {
        if (type === 'offer_created') {
            return new NotificationOfferCreated()
        }

        if (type === 'offer_earned_amount') {
            return new NotificationOfferEarned()
        }

        if (type === 'member_successful_upload') {
            return new NotificationSuccessfulUpload()
        }

        throw new Error('Invalid Notification Type')
    }
}

module.exports = NotificationFactory