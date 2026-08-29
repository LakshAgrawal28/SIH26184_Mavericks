package main

import (
	"crypto/tls"
	"crypto/x509"
	"net/http"
)

// InsecureTLSConfig demonstrates weak TLS settings for scanner detection.
func InsecureTLSConfig() *tls.Config {
	return &tls.Config{
		MinVersion:               tls.VersionTLS10,
		MaxVersion:               tls.VersionTLS12,
		PreferServerCipherSuites: true,
		InsecureSkipVerify:       true,
		CipherSuites: []uint16{
			tls.TLS_RSA_WITH_RC4_128_SHA,
			tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
			tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
		},
	}
}

func startServer(cert *x509.Certificate) {
	cfg := InsecureTLSConfig()
	_ = http.Server{TLSConfig: cfg}
}
