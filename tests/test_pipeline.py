import subprocess
import json
import os

def test_pipeline():
    audio_file = os.path.abspath(r'backend\test_audio.wav')
    if not os.path.exists(audio_file):
        print(f"Error: {audio_file} not found")
        return

    # Windows curl needs double quotes for paths with spaces, but subprocess handles list args.
    # However, 'audio=@...' syntax needs care.
    
    cmd = [
        'curl', 
        '-F', f'audio=@{audio_file}', 
        'http://localhost:5000/api/analyze'
    ]
    
    print(f"Executing curl...")
    
    try:
        # encoding='utf-8' might fail if system locale is different, try errors='replace'
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        
        print(f"Return Code: {result.returncode}")
        if result.stderr:
            print("STDERR snippet:", result.stderr[:200])
        
        output = result.stdout.strip()
        print("STDOUT:", output)
        
        if result.returncode == 0 and output:
            try:
                data = json.loads(output)
                print("\nResponse Data:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                if 'text' in data and 'emotion' in data:
                    print("\n✅ Pipeline Test PASSED!")
                else:
                    print("\n❌ Validation Failed: Missing keys")
            except json.JSONDecodeError:
                print("\n❌ Failed to parse JSON")
        else:
            print("\n❌ Curl failed or empty response")

    except Exception as e:
        print(f"❌ Script execution failed: {e}")

if __name__ == "__main__":
    test_pipeline()
