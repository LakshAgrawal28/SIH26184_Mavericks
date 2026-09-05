package com.ntro.security;

import javax.crypto.Cipher;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;

/** Mixed-enterprise Java service — RSA/ECB + weak digest for ECDAT demo. */
public class CryptoService {
    public byte[] wrapSecret(byte[] plaintext) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        return cipher.doFinal(plaintext);
    }

    public String fingerprint(byte[] data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(data);
        return javax.xml.bind.DatatypeConverter.printHexBinary(digest);
    }

    public byte[] legacyAes(byte[] data) throws Exception {
        Cipher aes = Cipher.getInstance("AES/CBC/PKCS5Padding");
        return aes.doFinal(data);
    }
}
