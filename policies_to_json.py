import os
import json

def list_tree(path, depth, data):
    for root, subdirs, files in os.walk(path):
        if depth == 1:
            #print("AGENT TYPE: " + path.split('/')[-1].strip("s"))
            data.append({
                "type": path.split('/')[-1].strip("s"),
                "morphologies": []
            })

        elif depth == 2:
            #print("MORPHOLOGY: " + path.split('/')[-1])
            for i, agent_type in enumerate(data):
                if path.split('/')[-2].strip("s") == agent_type["type"]:
                    data[i]["morphologies"].append({
                        "morphology": path.split('/')[-1],
                        "seeds" : []
                    })

        if len(subdirs) == 0:
            #print("SEED: " + path.split('/')[-1])
            for i, agent_type in enumerate(data):
                if path.split('/')[-3].strip("s") == agent_type["type"]:
                    for j, morphology in enumerate(data[i]["morphologies"]):
                        if path.split('/')[-2] == morphology["morphology"]:
                            data[i]["morphologies"][j]["seeds"].append({
                                "seed": path.split('_')[-1],
                                "path": path
                            })

        else:
            for subdir in subdirs:
                list_tree(path + '/' + subdir, depth+1, data)

        return

if __name__ == "__main__":
    data = []
    list_tree('./policy_models', 0, data)
    print(data)
    with open("./policies.json", "w") as write_file:
        json.dump(data, write_file)