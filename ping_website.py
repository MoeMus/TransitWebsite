# Pings the website to determine if it is up or down. If the website is down, it will attempt to restart the
# docker containers

import time
import subprocess
import requests
import dotenv

dotenv.load_dotenv('.env')

def ping_website(url):
    try:
        response = requests.get(url)
        return response.status_code != 404

    except requests.exceptions.RequestException as e:
        print(f"Error pinging {url}: {e}")
        return False


def restart_docker_containers():
    try:
        subprocess.run(["docker compose", "restart"], check=True)
        print("Docker containers restarted successfully.")

        result = subprocess.run(
            ["bash", "check_if_database_needs_restore.sh"],
            capture_output=True,
            text=True
        )

        print(result.stdout.strip())

        if result.returncode == 1:
            restore_result = subprocess.run(
                ["bash", "restore_database.sh"],
                capture_output=True,
                text=True
            )
            if restore_result.returncode == 0:
                print("Database restored successfully.")
            else:
                print(f"Error restoring database: {restore_result.stderr.strip()}")

        elif result.returncode == 0:
            print("No restore needed")
        else:
            print(f"Unexpected return code: {result.returncode}")
            print(result.stderr.strip())

    except subprocess.CalledProcessError as e:
        print(f"Error restarting docker containers: {e}")


if __name__ == "__main__":
    website_url = dotenv.get_key('.env', 'WEBSITE_URL')
    if not website_url:
        print("WEBSITE_URL not found in .env file.")
        exit(1)

    if not ping_website(website_url):
        restart_docker_containers()
