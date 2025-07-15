# GCP Pub/Sub Emulator Setup

## 1. Install Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

## 2. Install Pub/Sub Emulator

```bash
gcloud components install pubsub-emulator
```

## 3. Start the Emulator

```bash
# Start the emulator on port 8085
gcloud beta emulators pubsub start --project=test-project

# Or with custom port
gcloud beta emulators pubsub start --project=test-project --host-port=localhost:8085
```

## 4. Set Environment Variables

```bash
# Get the environment variables
$(gcloud beta emulators pubsub env-vars)

# Or manually set them
export PUBSUB_EMULATOR_HOST=localhost:8085
export PUBSUB_PROJECT_ID=test-project
```

## 5. Create Topics and Subscriptions

```bash
# Create a topic
gcloud pubsub topics create test-topic --project=test-project

# Create a subscription
gcloud pubsub subscriptions create test-subscription \
  --topic=test-topic \
  --project=test-project
```

## 6. Update Your Code

```typescript
import { SubscriptionManager } from 'broker-lib';

const subscriptionManager = new SubscriptionManager({
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'test-project', // Use the emulator project ID
    // No keyFilename needed for emulator
  }
});

// The emulator will automatically be used when PUBSUB_EMULATOR_HOST is set
```

## 7. Test Script

```bash
#!/bin/bash
# test-emulator.sh

echo "Starting GCP Pub/Sub Emulator..."
gcloud beta emulators pubsub start --project=test-project --host-port=localhost:8085 &
EMULATOR_PID=$!

echo "Waiting for emulator to start..."
sleep 5

echo "Setting environment variables..."
$(gcloud beta emulators pubsub env-vars)

echo "Creating test topic..."
gcloud pubsub topics create test-topic --project=test-project

echo "Creating test subscription..."
gcloud pubsub subscriptions create test-subscription \
  --topic=test-topic \
  --project=test-project

echo "Running your application..."
node your-app.js

echo "Cleaning up..."
kill $EMULATOR_PID
``` 