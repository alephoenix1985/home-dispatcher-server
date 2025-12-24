/**
 * @file Google Home Scripting Service
 * Handles integration with Google Home Scripting API to trigger automation events.
 */

import axios from 'axios';
import { logSection } from "psf-core-node/services/logger-node.service.js";

const logger = logSection('GOOGLE-HOME-SERVICE');

/**
 * Triggers an event in Google Home Scripting.
 * @param {string} eventId - The ID of the event to trigger (e.g., 'food_level_critical').
 * @param {object} payload - Additional data to send with the event.
 * @returns {Promise<boolean>} - Returns true if the event was triggered successfully.
 */
export const triggerHomeScriptEvent = async (eventId, payload = {}) => {
    const googleHomeEndpoint = process.env.GOOGLE_HOME_SCRIPT_ENDPOINT;
    const googleHomeKey = process.env.GOOGLE_HOME_SCRIPT_KEY;

    if (!googleHomeEndpoint || !googleHomeKey) {
        logger.warn('Google Home Scripting configuration missing. Skipping event trigger.');
        return false;
    }

    try {
        logger.info(`Triggering Google Home event: ${eventId}`, payload);
        
        // This is a placeholder structure. The actual implementation depends on 
        // how the Google Home Scripting API is exposed (e.g., via a webhook or direct API call).
        // Assuming a webhook pattern for now based on typical integrations.
        const response = await axios.post(googleHomeEndpoint, {
            event: eventId,
            key: googleHomeKey,
            data: payload,
            timestamp: new Date().toISOString()
        });

        if (response.status >= 200 && response.status < 300) {
            logger.info(`Successfully triggered Google Home event: ${eventId}`);
            return true;
        } else {
            logger.error(`Failed to trigger Google Home event. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logger.error(`Error triggering Google Home event: ${eventId}`, error);
        return false;
    }
};
