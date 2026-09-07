package com.example;

import javax.net.ssl.SSLContext;
import java.security.KeyStore;

public class TlsBoot {
    public SSLContext boot() throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        return SSLContext.getInstance("TLSv1");
    }
}
