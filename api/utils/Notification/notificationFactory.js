const NotificationOfferCreated = require('./notificationOfferCreated')
const NotificationOfferEarned = require('./notificationOfferEarned')
const NotificationSuccessfulUpload = require('./notificationSuccessfulUpload')
const NotificationFollowMember = require('./notificationFollowMember')

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

        if (type === 'member_follow_member') {
            return new NotificationFollowMember()
        }

        throw new Error('Invalid Notification Type')
    }
}

module.exports = NotificationFactory