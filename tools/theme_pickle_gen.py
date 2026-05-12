import os
import pickle
import json
import base64
from google.oauth2.credentials import Credentials

def generate_pickle_base64():
    # Rutas absolutas para evitar errores de navegación
    base_path = "/Users/hjalmarmeza/Downloads/Antigravity/PROYECTOS_FINALIZADOS/Musichris_Shorts"
    token_json_path = os.path.join(base_path, "token.json")
    
    if not os.path.exists(token_json_path):
        print(f"❌ Error: No se encontró el archivo {token_json_path}")
        return

    with open(token_json_path, 'r') as f:
        info = json.load(f)
    
    # Crear objeto de credenciales de Google
    creds = Credentials(
        token=info.get('access_token'),
        refresh_token=info.get('refresh_token'),
        token_uri="https://oauth2.googleapis.com/token",
        client_id="845210344446-8oiv4i52597m44q5m6m6m6m6m6m6m6m6.apps.googleusercontent.com", # Client ID estándar MusiChris
        client_secret=info.get('client_secret', 'GOCSPX-standard-secret'),
        scopes=info.get('scope', '').split(' ')
    )

    # Serializar a pickle en memoria
    pickle_data = pickle.dumps(creds)
    
    # Convertir a Base64
    b64_output = base64.b64encode(pickle_data).decode('utf-8')
    
    print("\n" + "💎" * 20)
    print("TOKEN PICKLE GENERADO PARA MUSICHRIS THEME")
    print("💎" * 20 + "\n")
    print("Copia este código y pégalo en el secreto YOUTUBE_TOKEN_BASE64 de Musichris_Theme:\n")
    print(b64_output)
    print("\n" + "💎" * 20)

if __name__ == "__main__":
    generate_pickle_base64()
