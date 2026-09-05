package main

import (
	"crypto/tls"
	"net/http"
)

func mixedEnterpriseTLS() *tls.Config {
	return &tls.Config{
		MinVersion:         tls.VersionTLS10,
		InsecureSkipVerify: true,
		CipherSuites: []uint16{
			tls.TLS_RSA_WITH_RC4_128_SHA,
			tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
		},
	}
}

func start(cfg *tls.Config) {
	_ = http.Server{TLSConfig: cfg}
}
