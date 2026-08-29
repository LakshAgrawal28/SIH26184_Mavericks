// Obfuscated crypto usage — demonstrates scanner false-negative boundary
// The scanner's regex patterns should NOT detect these (intentional)
import javax.crypto.Cipher;
import java.util.Base64;

public class ObfuscatedCrypto {
    // String-split obfuscation — scanner won't detect
    private static final String ALGO = "AE" + "S";
    private static final String MODE = "AES/" + "ECB" + "/PKCS5Padding";
    
    // Base64-encoded key — scanner won't detect the actual key
    private static final String KEY_B64 = "c2VjcmV0a2V5MTIzNDU2Nzg="; // base64 of "secretkey12345678"
    
    // Runtime assembly — not detectable by static analysis
    public static Cipher getCipher() throws Exception {
        String algorithm = new StringBuilder("RSA").reverse().toString(); // won't match due to reverse
        // In real obfuscation, algorithm name is assembled at runtime
        byte[] decoded = Base64.getDecoder().decode(KEY_B64);
        return Cipher.getInstance(MODE); // This one SHOULD be detected
    }
    
    // Dynamic class loading — scanner won't detect  
    public static void loadProvider() throws Exception {
        String className = "org.bouncycastle.jce." + "provider.BouncyCastleProvider";
        Class<?> clazz = Class.forName(className);
    }
}
