"use strict";

let expect = require('expect.js');
const { Keychain } = require('../password-manager');

function expectReject(promise) {
    return promise.then(
        (result) => expect().fail(`Expected failure, but function returned ${result}`),
        (error) => {
            // Error occurred as expected
            if (typeof error === 'string') {
                // Convert string to Error if needed
                throw new Error(error);
            }
        },
    );
}

describe('Member 4 - Security Defenses', function() {
    this.timeout(10000);
    let password = "securePassword123!";

    describe('Swap Attack Defense', function() {
        
        it('detects swapped entries', async function() {
            const kc = await Keychain.init(password);
            await kc.set("google.com", "googlePass123");
            await kc.set("evil.com", "evilPass456");
            
            const [repr, _] = await kc.dump();
            const data = JSON.parse(repr);
            
            // Manually swap the two entries in kvs
            const keys = Object.keys(data.kvs);
            const temp = data.kvs[keys[0]];
            data.kvs[keys[0]] = data.kvs[keys[1]];
            data.kvs[keys[1]] = temp;
            
            const tamperedRepr = JSON.stringify(data);
            
            // Load without checksum - swap defense should still work
            const loaded = await Keychain.load(password, tamperedRepr);
            
            // Trying to get should detect the swap
            try {
                await loaded.get("google.com");
                expect().fail("Should have detected swap attack");
            } catch (e) {
                // Check that error mentions swap
                const errorMsg = e.message || e.toString();
                expect(errorMsg.toLowerCase()).to.match(/swap/);
            }
        });
        
        it('swap defense works independently of checksum', async function() {
            const kc = await Keychain.init(password);
            await kc.set("site1.com", "password1");
            await kc.set("site2.com", "password2");
            
            const [repr, checksum] = await kc.dump();
            const data = JSON.parse(repr);
            
            // Swap entries
            const keys = Object.keys(data.kvs);
            [data.kvs[keys[0]], data.kvs[keys[1]]] = 
            [data.kvs[keys[1]], data.kvs[keys[0]]];
            
            const tampered = JSON.stringify(data);
            
            // Load WITHOUT checksum
            const loaded = await Keychain.load(password, tampered);
            
            // Should still detect swap
            try {
                await loaded.get("site1.com");
                expect().fail("Should have detected swap attack");
            } catch (e) {
                const errorMsg = e.message || e.toString();
                expect(errorMsg.toLowerCase()).to.match(/swap/);
            }
        });
    });

    describe('Rollback Attack Defense', function() {
        
        it('detects rollback via checksum mismatch', async function() {
            const kc = await Keychain.init(password);
            await kc.set("bank.com", "oldPassword123");
            const [oldRepr, oldCheck] = await kc.dump();
            
            // Update password
            await kc.set("bank.com", "newPassword456");
            const [newRepr, newCheck] = await kc.dump();
            
            // Try to load old data with new checksum - should fail
            try {
                await Keychain.load(password, oldRepr, newCheck);
                expect().fail("Should have detected rollback");
            } catch (e) {
                const errorMsg = e.message || e.toString();
                expect(errorMsg.toLowerCase()).to.match(/checksum|integrity/);
            }
        });
        
        it('accepts correct checksum', async function() {
            const kc = await Keychain.init(password);
            await kc.set("site.com", "myPassword");
            const [repr, checksum] = await kc.dump();
            
            // Should load successfully
            const loaded = await Keychain.load(password, repr, checksum);
            const retrieved = await loaded.get("site.com");
            expect(retrieved).to.equal("myPassword");
        });
    });

    describe('Domain Privacy', function() {
        
        it('does not store domain names in plaintext', async function() {
            const kc = await Keychain.init(password);
            await kc.set("supersecret.com", "myPassword123");
            const [repr, _] = await kc.dump();
            
            // Domain should not appear in serialized form
            expect(repr).not.to.contain("supersecret.com");
            expect(repr).not.to.contain("myPassword123");
        });
    });
});