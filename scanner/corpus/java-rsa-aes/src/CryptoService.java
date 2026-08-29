package com.ntro.security;

import javax.crypto.Cipher;
import java.security.KeyPairGenerator;

public class CryptoService {
    public void encryptData() throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
    }

    public void weakHash() {
        // Reference to weak algorithms for detection
        String algo = "MD5";
        String aes = "AES-128-CBC";
    }
}
