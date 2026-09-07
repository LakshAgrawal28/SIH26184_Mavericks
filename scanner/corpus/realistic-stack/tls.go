package main

import (
	"crypto/tls"
	"golang.org/x/crypto/chacha20poly1305"
)

func cfg() *tls.Config {
	_ = chacha20poly1305.NonceSize
	return &tls.Config{MinVersion: tls.VersionTLS10, InsecureSkipVerify: true}
}
