using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI; //This clause makes all the UI syntax work




public class ChatScript : MonoBehaviour
{
    // public string username; //this is the default username for the player, wahtevr they put in it.

    public int maxMessages = 25; // max messages before they are removed from the chat

    [SerializeField] GameObject chatPanel, textObject;
    [SerializeField] InputField chatBox;

    [SerializeField] AudioSource knock;
    public static ChatScript chatScript;


    [SerializeField] Color playerMessage, info; //im not using the bit, was a palceholder

    [SerializeField]
    List<Message> messageList = new List<Message>(); //creates the list

    // Start is called before the first frame update
    void Awake()
    {
        chatScript = this;
    }

    // Update is called once per frame
    void Update()
    {
        //TODO: is this too inefficient?
        if (Net.manager.amExplorer == false) {
            chatBox.DeactivateInputField();
            return;
        }

        if (chatBox.text != "") //when the chatbox is empty then you can hit enter to push the message, then the chatbox becomes empty again.
        {

            if (Input.GetKeyDown(KeyCode.Return))
            {
                // if (username == "") {
                //     SendMessageToChat("info: can't send message until connected to server", Message.MessageType.info, true);
                // } else if (Net.manager.amExplorer == false) {
                //     SendMessageToChat("info: GHOSTS CAN'T TALK", Message.MessageType.info, true);
                // } else {
                Net.manager.EmitGuess(chatBox.text);
                // SendMessageToChat(chatBox.text, Message.MessageType.playerMessage);
                chatBox.text = "";
                // }

            }
        }

        // else
        // {
        //     if(!chatBox.isFocused && Input.GetKeyDown(KeyCode.Return)) // if you have not selected the chat box, you can hit enter to activate or just click on it.
        //     {
        //         chatBox.ActivateInputField();

        //     }

        // }



        // if(!chatBox.isFocused) // if the chat box is not selected than you can hit space to knock.
        // {
        //     if(Input.GetKeyDown(KeyCode.Space) && Net.manager.amExplorer == false)
        //     {

        //         knock.Play();
        //         Net.manager.SendPlayerDisturb();
        //     }


        // }


    }

    public void SendMessageToChat(string text, Message.MessageType messagetype) //this function removes the excess text after the max cap is reached.
    {

        if(messageList.Count >= maxMessages)
        {
            Destroy(messageList[0].textObject.gameObject);
            messageList.Remove(messageList[0]);
        }

        //setting variables
        Message newMessage = new Message();

        newMessage.text = text;

        GameObject newText = Instantiate(textObject, chatPanel.transform);

        newMessage.textObject = newText.GetComponent<Text>();

        // Display the result of a guess
        if (messagetype == Message.MessageType.result) {
            string displayText = "";
            if (text == "true") {
                displayText = "Guess was correct!";
                newMessage.textObject.color = Color.green;
            } else {
                displayText = "Guess was incorrect!";
                newMessage.textObject.color = Color.red;
            }

            newMessage.text = displayText;
            newMessage.textObject.text = displayText;
            messageList.Add(newMessage);
            return;
        } else {
            // Display a guess itself
            newMessage.textObject.color = Color.black;
            newMessage.textObject.text = newMessage.text;
            messageList.Add(newMessage);
        }

    }



}


[System.Serializable]
public class Message
{
   //setting other parameters for the Message syntax that we have created
    public string text;
    public Text textObject;
    public MessageType messageType;

    public enum MessageType
    {
        playerMessage,
        info,
        result

    }

}

