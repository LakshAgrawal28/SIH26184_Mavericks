/* Minimal OpenSSL EVP / legacy API references for ECDAT corpus (not compiled). */
#include <openssl/des.h>
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/sha.h>

void legacy_ntro_demo(unsigned char *key, unsigned char *iv, SHA_CTX *sha_ctx) {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key, iv);

    RSA *rsa = RSA_generate_key(2048, RSA_F4, NULL, NULL);

    SHA1_Init(sha_ctx);

    DES_key_schedule schedule;
    DES_set_key((const_DES_cblock *)key, &schedule);

    EVP_MD_CTX *md = EVP_MD_CTX_new();
    EVP_DigestInit_ex(md, EVP_md5(), NULL);

    EVP_PKEY *pkey = EVP_PKEY_new();
    EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_RSA, NULL);

    (void)rsa;
    (void)pkey;
    (void)pctx;
    (void)md;
    (void)ctx;
    (void)schedule;
}
