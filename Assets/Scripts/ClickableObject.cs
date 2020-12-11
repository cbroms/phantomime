using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class ClickableObject : MonoBehaviour
{
    public bool Shook;
    private Animator animator;
    //TODO: attach this script to each gameobject that is a clickable thingy
    Button button; // makes this object clickable
    List<Sprite> taskSprites; // list of sprites for this object ordered by task
    Image ObjectImage; // TODO: update based on if we are using Image or SpriteRenderer!
    int myObjectIndex; // what is our index in the NetManager's list

    // Start is NOT called since this gameobject is inactive.
    // So we update these every time the game object is enabled (should be once only)

    public void Awake()
    {
        animator = GetComponent<Animator>();
    }

    void OnEnable()
    {
        button = this.GetComponent<Button>();
        button.onClick.AddListener(() => ClickFunction());
        ObjectImage = this.GetComponent<Image>();

        //TODO: double check this gets initialized properly
        myObjectIndex = Net.manager.WhichObject(this.gameObject);
        if (myObjectIndex == -1) return; //not a valid object

        //TODO: create folder called Resources in assets with subfolders "object1", "object2", etc. within each folder, add 3 sprites, each labelled (0,1,2) based on which task they are

        // Populate our sprite list
        taskSprites = new List<Sprite>();
        object[] loadedSprite = Resources.LoadAll("object" + myObjectIndex, typeof(Sprite));
        for (int i = 0; i < loadedSprite.Length; i++)
        {
            taskSprites.Add((Sprite)loadedSprite[i]);
        }
        Debug.Log("Object " + myObjectIndex + " Initialized");
        ObjectImage.sprite = taskSprites[0];
    }

    // Indicate somebody has clicked on the 
    private void ClickFunction() {
        Debug.Log(Net.manager == null);
        if (Net.manager.amExplorer) {
                // do nothing
            return;
        } else {
           // If we are a ghost

           if (myObjectIndex != -1) { // We are a valid task object
                // Send event noting we clicked an object
                Net.manager.EmitMoveObject(myObjectIndex);

                //TODO: anything else we wanna do on the ghost side only
                // when they click on an object?
                OnMoved();
           }
        }
    }

    //TODO: animate rattle movement for this object
    public void OnMoved() {
        // animate
        //Debug.Log("object moved");
        StartCoroutine(ShakeObject());
    }

    public void ChangeSprite(int currTask) {
        ObjectImage.sprite = taskSprites[currTask];
    }
    


    // Update is called once per frame
    void Update()
    {
        animator.SetBool("Shake", Shook);
    }

    public IEnumerator ShakeObject()

    {
        Shook = true;
        yield return new WaitForSeconds(0.1f);
        Shook = false;
    }

}
