/**
 * @file Broadlink Service
 * Handles integration with local Broadlink devices for IR/RF control.
 */

import { discover } from 'node-broadlink';
import { logSection } from "psf-core-node/services/logger-node.service.js";

const logger = logSection('BROADLINK-SERVICE');

let cachedDevice = null;

/**
 * Discovers and authenticates with a Broadlink device on the local network.
 * @returns {Promise<object|null>} The authenticated device instance or null if not found.
 */
async function getDevice() {
    if (cachedDevice) return cachedDevice;

    logger.info("🔍 Searching for Broadlink devices on local network...");
    try {
        const devices = await discover();

        if (devices.length === 0) {
            logger.warn("❌ No Broadlink devices found. Ensure it is on the same network.");
            return null;
        }

        const device = devices[0];
        logger.info(`✅ Connected to: ${device.getType()} (${device.host.address})`);

        // Authentication required to get the local session key
        await device.auth();
        cachedDevice = device;
        return device;

    } catch (error) {
        logger.error("❌ Error connecting to Broadlink device:", error.message);
        return null;
    }
}

/**
 * Sends a command to the Broadlink device.
 * @param {string} hexCommand - The hex string of the IR/RF command.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
export const sendBroadlinkCommand = async (hexCommand) => {
    if (!hexCommand) {
        logger.error("❌ No command provided.");
        return false;
    }

    try {
        const device = await getDevice();
        if (!device) return false;

        const payload = Buffer.from(hexCommand, 'hex');
        // node-broadlink uses sendData for RM devices
        await device.sendData(payload);

        logger.info("🚀 IR/RF signal sent successfully.");
        return true;

    } catch (error) {
        logger.error("❌ Failed to send Broadlink command:", error.message);
        // Invalidate cache on error to force rediscovery next time
        cachedDevice = null;
        return false;
    }
};
