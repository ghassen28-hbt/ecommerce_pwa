import base64
from cryptography.hazmat.primitives.asymmetric import ec

def b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

# 1) clé privée EC
private_key = ec.generate_private_key(ec.SECP256R1())
private_num = private_key.private_numbers().private_value
private_bytes = private_num.to_bytes(32, "big")

# 2) clé publique EC (format non compressé 0x04 || X || Y)
public_key = private_key.public_key()
public_num = public_key.public_numbers()
x_bytes = public_num.x.to_bytes(32, "big")
y_bytes = public_num.y.to_bytes(32, "big")
public_bytes = b"\x04" + x_bytes + y_bytes

print("VAPID_PRIVATE_KEY =", b64url(private_bytes))
print("VAPID_PUBLIC_KEY  =", b64url(public_bytes))
