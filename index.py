class solution:
    def countin(self,arr,k):
        n=len(arr)
        count=0
        for i in range(n):
            if len(arr[i]) == k:
                count += k
        return count

arr=[int(x) for x in input().strip().split()]
k=int(input(""))
ob=solution()
print(ob.countin(arr,k))